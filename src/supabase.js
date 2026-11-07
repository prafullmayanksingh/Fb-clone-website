import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      flowType: "pkce",
    },
    realtime: { params: { eventsPerSecond: 5 } },
  })
  : null;

export const backendConfigured = Boolean(supabase);

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

export async function signUp({ email, password, name }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name.trim() },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  return unwrap(await supabase.auth.signInWithPassword({ email, password }));
}

export async function signInWithGoogle() {
  return unwrap(await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  }));
}

export async function sendPasswordReset(email) {
  return unwrap(await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }));
}

export async function updatePassword(password) {
  return unwrap(await supabase.auth.updateUser({ password }));
}

export async function signOut() {
  return unwrap(await supabase.auth.signOut());
}

export async function getProfile(userId) {
  const result = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return unwrap(result);
}

export async function saveProfile(userId, profile) {
  return unwrap(await supabase.from("profiles").update({
    full_name: profile.name.trim(),
    bio: profile.bio.trim(),
    avatar_url: profile.avatarPath || profile.avatar || null,
    cover_url: profile.coverPath || profile.cover || null,
    education: profile.education?.trim() || null,
    work: profile.work?.trim() || null,
    location: profile.location?.trim() || null,
    website: profile.website?.trim() || null,
    privacy: profile.privacy || "public",
  }).eq("id", userId).select().single());
}

export async function uploadMedia(userId, file) {
  const extension = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const uploaded = unwrap(await supabase.storage.from("community-media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  }));
  return uploaded.path;
}

export async function signedMediaURL(path, expiresIn = 3600) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  const signed = unwrap(await supabase.storage.from("community-media").createSignedUrl(path, expiresIn));
  return signed.signedUrl;
}

export async function removeMedia(path) {
  const { error } = await supabase.storage.from("community-media").remove([path]);
  if (error) throw error;
}

export async function createPost({ userId, text, imageUrls = [], pollOptions = [], visibility = "public", groupId = null, pageId = null }) {
  const postResult = await supabase.from("posts").insert({
    user_id: userId,
    body: text,
    visibility,
    group_id: groupId,
    page_id: pageId,
  }).select("id, user_id, body, visibility, created_at").single();
  if (postResult.error) {
    if (imageUrls.length) {
      const cleanup = await supabase.storage.from("community-media").remove(imageUrls);
      if (cleanup.error) console.error("Could not clean up uploaded media:", cleanup.error);
    }
    throw postResult.error;
  }
  const post = postResult.data;
  if (pollOptions.length) {
    const pollResult = await supabase.rpc("create_post_poll", {
      target_post_id: post.id,
      target_options: pollOptions.map((optionText) => optionText.trim()),
    });
    if (pollResult.error) {
      const cleanup = await supabase.from("posts").delete().eq("id", post.id);
      if (cleanup.error) console.error("Could not clean up an incomplete poll post:", cleanup.error);
      if (imageUrls.length) {
        const mediaCleanup = await supabase.storage.from("community-media").remove(imageUrls);
        if (mediaCleanup.error) console.error("Could not clean up uploaded media:", mediaCleanup.error);
      }
      throw pollResult.error;
    }
  }
  if (imageUrls.length) {
    const mediaResult = await supabase.from("post_media").insert(imageUrls.map((url, position) => ({
      post_id: post.id,
      user_id: userId,
      url,
      kind: "image",
      position,
    })));
    if (mediaResult.error) {
      const cleanup = await supabase.from("posts").delete().eq("id", post.id);
      if (cleanup.error) console.error("Could not clean up an incomplete post:", cleanup.error);
      const mediaCleanup = await supabase.storage.from("community-media").remove(imageUrls);
      if (mediaCleanup.error) console.error("Could not clean up uploaded media:", mediaCleanup.error);
      throw mediaResult.error;
    }
  }
  return post;
}

function pollFromPostRow(row, userId) {
  const poll = Array.isArray(row.post_polls) ? row.post_polls[0] : row.post_polls;
  if (!poll) return null;
  const pollOptions = poll.post_poll_options || [];
  const options = [...pollOptions]
    .sort((left, right) => left.position - right.position)
    .map((option) => ({
      id: option.id,
      text: option.option_text,
      votes: option.vote_count || 0,
    }));
  const ownVote = pollOptions
    .flatMap((option) => option.post_poll_votes || [])
    .find((vote) => vote.user_id === userId);
  return { options, ownOptionId: ownVote?.option_id || null };
}

export async function votePostPoll({ postId, optionId, userId }) {
  const { error } = await supabase.from("post_poll_votes").upsert(
    { post_id: postId, option_id: optionId, user_id: userId },
    { onConflict: "post_id,user_id" },
  );
  if (error) throw error;
}

export async function fetchFeed(userId, { offset = 0, limit = 20 } = {}) {
  const result = await supabase.from("posts")
    .select("id,user_id,body,visibility,group_id,page_id,pinned_at,created_at,profiles!posts_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy),post_media(id,url,kind,position),comments(id,user_id,parent_id,body,created_at,profiles!comments_user_id_fkey(id,full_name,avatar_url),comment_reactions(user_id,kind)),reactions(user_id,kind),post_polls(post_id,post_poll_options(id,option_text,position,vote_count,post_poll_votes(user_id,option_id)))")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const rows = unwrap(result);
  return Promise.all(rows.map(async (row) => {
    const reactionRows = row.reactions || [];
    const ownReaction = reactionRows.find((reaction) => reaction.user_id === userId);
    const mediaRows = (row.post_media || []).filter((media) => media.kind === "image")
      .sort((left, right) => left.position - right.position);
    const images = await Promise.all(mediaRows.map(async (media) => {
      const signed = unwrap(await supabase.storage.from("community-media").createSignedUrl(media.url, 3600));
      return signed.signedUrl;
    }));
    return {
      id: row.id,
      author: row.user_id,
      text: row.body || "",
      images,
      image: images[0] || "",
      time: new Date(row.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      likes: reactionRows.length,
      comments: (row.comments || []).map((comment) => ({
        id: comment.id,
        author: comment.user_id,
        parentId: comment.parent_id,
        text: comment.body,
        time: new Date(comment.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        profile: comment.profiles,
        likes: comment.comment_reactions?.length || 0,
        liked: comment.comment_reactions?.some((reaction) => reaction.user_id === userId) || false,
      })),
      shares: 0,
      liked: Boolean(ownReaction),
      reactionKind: ownReaction?.kind || null,
      groupId: row.group_id,
      pageId: row.page_id,
      poll: pollFromPostRow(row, userId),
      pinned: Boolean(row.pinned_at),
      remote: true,
      profile: row.profiles,
    };
  }));
}

export async function searchCommunity(query) {
  const term = query.replace(/[%_,()[\]]/g, " ").trim().replace(/\s+/g, " ").slice(0, 100);
  if (!term) return { posts: [], people: [], groups: [] };
  const session = await getSession();
  const hashtag = term.match(/^#([a-z0-9_]{1,50})$/i);
  const [profilesResult, groupsResult, postsResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,avatar_url,bio,cover_url,privacy")
      .ilike("full_name", `%${term.replace(/^#/, "")}%`).limit(12),
    supabase.from("groups").select("id,name,description,is_public")
      .ilike("name", `%${term.replace(/^#/, "")}%`).limit(12),
    hashtag
      ? supabase.from("post_hashtags").select("posts!inner(id,user_id,body,visibility,group_id,page_id,pinned_at,created_at,profiles!posts_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy),post_media(id,url,kind,position),comments(id,user_id,parent_id,body,created_at,profiles!comments_user_id_fkey(id,full_name,avatar_url),comment_reactions(user_id,kind)),reactions(user_id,kind),post_polls(post_id,post_poll_options(id,option_text,position,vote_count,post_poll_votes(user_id,option_id)))),hashtags!inner(tag)").eq("hashtags.tag", hashtag[1].toLowerCase()).limit(30)
      : supabase.from("posts").select("id,user_id,body,visibility,group_id,page_id,pinned_at,created_at,profiles!posts_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy),post_media(id,url,kind,position),comments(id,user_id,parent_id,body,created_at,profiles!comments_user_id_fkey(id,full_name,avatar_url),comment_reactions(user_id,kind)),reactions(user_id,kind),post_polls(post_id,post_poll_options(id,option_text,position,vote_count,post_poll_votes(user_id,option_id)))")
        .ilike("body", `%${term}%`).order("created_at", { ascending: false }).limit(30),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (groupsResult.error) throw groupsResult.error;
  if (postsResult.error) throw postsResult.error;
  const postRows = hashtag ? (postsResult.data || []).map((row) => row.posts).filter(Boolean) : postsResult.data;
  return {
    people: profilesResult.data,
    groups: groupsResult.data,
    posts: await Promise.all(postRows.map(async (row) => {
      const media = (row.post_media || []).filter((item) => item.kind === "image").sort((left, right) => left.position - right.position);
      const images = await Promise.all(media.map(async (item) => unwrap(await supabase.storage.from("community-media").createSignedUrl(item.url, 3600)).signedUrl));
      return {
        id: row.id, author: row.user_id, text: row.body || "", images, image: images[0] || "",
        time: new Date(row.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        likes: row.reactions?.length || 0, comments: row.comments || [], shares: 0,
        pinned: Boolean(row.pinned_at), groupId: row.group_id, pageId: row.page_id,
        poll: pollFromPostRow(row, session?.user.id),
        remote: true, profile: row.profiles,
      };
    })),
  };
}

export async function fetchTrendingHashtags() {
  return unwrap(await supabase.rpc("get_trending_hashtags", { limit_count: 10 }))
    .map((item) => ({ tag: item.tag, count: Number(item.post_count) }));
}

export async function updatePost(postId, userId, updates) {
  return unwrap(await supabase.from("posts").update({
    body: updates.text.trim(),
    edited_at: new Date().toISOString(),
  }).eq("id", postId).eq("user_id", userId).select("id,body,edited_at").single());
}

export async function togglePinPost(postId, userId, pinned) {
  return unwrap(await supabase.from("posts").update({
    pinned_at: pinned ? null : new Date().toISOString(),
  }).eq("id", postId).eq("user_id", userId).select("id,pinned_at").single());
}

export async function savePost(postId, userId, saved) {
  if (saved) {
    const { error } = await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function fetchSavedPosts(userId) {
  return unwrap(await supabase.from("post_saves").select("post_id").eq("user_id", userId));
}

export async function createReport({ userId, postId, reportedUserId, reason }) {
  return unwrap(await supabase.from("reports").insert({
    reporter_id: userId,
    post_id: postId || null,
    reported_user_id: reportedUserId || null,
    reason: reason.trim(),
  }).select("id,status,created_at").single());
}

export async function fetchGroups(userId) {
  const { data: groupRows, error: groupError } = await supabase.from("groups")
    .select("id,owner_id,name,description,is_public,created_at,group_members(user_id,role)")
    .order("created_at", { ascending: false }).limit(50);
  if (groupError) throw groupError;
  const [membershipResult, requestResult] = await Promise.all([
    supabase.from("group_members").select("group_id,role").eq("user_id", userId),
    supabase.from("group_join_requests").select("group_id,status").eq("user_id", userId),
  ]);
  if (membershipResult.error) throw membershipResult.error;
  if (requestResult.error) throw requestResult.error;
  const myMemberships = membershipResult.data;
  const myRequests = requestResult.data;
  const memberIds = new Set(myMemberships.map((membership) => membership.group_id));
  return groupRows.map((group) => ({
    ...group,
    members: `${group.group_members.length} members`,
    joined: memberIds.has(group.id),
    role: myMemberships.find((membership) => membership.group_id === group.id)?.role,
    requestStatus: myRequests.find((request) => request.group_id === group.id)?.status || null,
  }));
}

export async function createGroup(userId, { name, description, isPublic }) {
  return unwrap(await supabase.from("groups").insert({
    owner_id: userId,
    name: name.trim(),
    description: description.trim(),
    is_public: isPublic,
  }).select("id,owner_id,name,description,is_public,created_at").single());
}

export async function joinGroup(groupId, userId) {
  const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: userId });
  if (error) throw error;
}

export async function requestGroupMembership(groupId) {
  return unwrap(await supabase.rpc("request_group_join", { target_group_id: groupId }));
}

export async function fetchGroupRequests(groupId) {
  return unwrap(await supabase.from("group_join_requests")
    .select("group_id,user_id,status,created_at,profile:profiles!group_join_requests_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy)")
    .eq("group_id", groupId).eq("status", "pending").order("created_at", { ascending: true }));
}

export async function reviewGroupJoinRequest(groupId, userId, approve) {
  return unwrap(await supabase.rpc("review_group_join_request", {
    target_group_id: groupId,
    target_user_id: userId,
    approve_request: approve,
  }));
}

export async function leaveGroup(groupId, userId) {
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw error;
}

export async function fetchGroupPosts(groupId) {
  const rows = unwrap(await supabase.from("posts")
    .select("id,user_id,body,visibility,group_id,pinned_at,created_at,profiles!posts_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy),post_media(id,url,kind,position),comments(id,user_id,parent_id,body,created_at,profiles!comments_user_id_fkey(id,full_name,avatar_url),comment_reactions(user_id,kind)),reactions(user_id,kind),post_polls(post_id,post_poll_options(id,option_text,position,vote_count,post_poll_votes(user_id,option_id)))")
    .eq("group_id", groupId).order("created_at", { ascending: false }).limit(50));
  const session = await getSession();
  return Promise.all(rows.map(async (row) => {
    const media = (row.post_media || []).filter((item) => item.kind === "image").sort((left, right) => left.position - right.position);
    const images = await Promise.all(media.map(async (item) => {
      const signed = unwrap(await supabase.storage.from("community-media").createSignedUrl(item.url, 3600));
      return signed.signedUrl;
    }));
    return {
      id: row.id,
      author: row.user_id,
      text: row.body || "",
      image: images[0] || "",
      images,
      time: new Date(row.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      likes: row.reactions?.length || 0,
      comments: (row.comments || []).map((comment) => ({
        id: comment.id,
        author: comment.user_id,
        parentId: comment.parent_id,
        text: comment.body,
        time: new Date(comment.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        profile: comment.profiles,
        likes: comment.comment_reactions?.length || 0,
        liked: false,
      })),
      shares: 0,
      pinned: Boolean(row.pinned_at),
      groupId: row.group_id,
      poll: pollFromPostRow(row, session?.user.id),
      remote: true,
      profile: row.profiles,
    };
  }));
}

export async function fetchPagePosts(pageId) {
  const rows = unwrap(await supabase.from("posts")
    .select("id,user_id,body,visibility,page_id,pinned_at,created_at,profiles!posts_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy),post_media(id,url,kind,position),comments(id,user_id,parent_id,body,created_at,profiles!comments_user_id_fkey(id,full_name,avatar_url),comment_reactions(user_id,kind)),reactions(user_id,kind),post_polls(post_id,post_poll_options(id,option_text,position,vote_count,post_poll_votes(user_id,option_id)))")
    .eq("page_id", pageId).order("created_at", { ascending: false }).limit(50));
  const session = await getSession();
  return Promise.all(rows.map(async (row) => {
    const images = await Promise.all((row.post_media || []).filter((item) => item.kind === "image")
      .sort((left, right) => left.position - right.position)
      .map(async (item) => unwrap(await supabase.storage.from("community-media").createSignedUrl(item.url, 3600)).signedUrl));
    return {
      id: row.id, author: row.user_id, text: row.body || "", images, image: images[0] || "",
      time: new Date(row.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      likes: row.reactions?.length || 0, comments: row.comments || [], shares: 0,
      pinned: Boolean(row.pinned_at), pageId: row.page_id, remote: true, profile: row.profiles,
      poll: pollFromPostRow(row, session?.user.id),
    };
  }));
}

export async function fetchPageAnalytics(pageId) {
  const [postsResult, reactionsResult, commentsResult] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("page_id", pageId),
    supabase.from("reactions").select("id,posts!inner(page_id)", { count: "exact", head: true }).eq("posts.page_id", pageId),
    supabase.from("comments").select("id,posts!inner(page_id)", { count: "exact", head: true }).eq("posts.page_id", pageId),
  ]);
  if (postsResult.error) throw postsResult.error;
  if (reactionsResult.error) throw reactionsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  return {
    posts: postsResult.count || 0,
    reactions: reactionsResult.count || 0,
    comments: commentsResult.count || 0,
  };
}

export async function fetchPages(userId) {
  const { data, error } = await supabase.from("pages")
    .select("id,owner_id,name,description,created_at,page_followers(user_id)")
    .order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data.map((page) => ({
    ...page,
    followers: page.page_followers.length,
    followed: page.page_followers.some((follower) => follower.user_id === userId),
  }));
}

export async function createPage(userId, { name, description }) {
  return unwrap(await supabase.from("pages").insert({
    owner_id: userId,
    name: name.trim(),
    description: description.trim(),
  }).select("id,owner_id,name,description,created_at").single());
}

export async function togglePageFollow(pageId, userId, following) {
  if (following) {
    const { error } = await supabase.from("page_followers").delete().eq("page_id", pageId).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("page_followers").insert({ page_id: pageId, user_id: userId });
  if (error) throw error;
}

export async function createStory({ userId, file, caption }) {
  const path = `${userId}/stories/${crypto.randomUUID()}.${file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg"}`;
  const uploaded = unwrap(await supabase.storage.from("community-media").upload(path, file, {
    cacheControl: "3600", contentType: file.type, upsert: false,
  }));
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const result = await supabase.from("stories").insert({
    user_id: userId,
    media_url: uploaded.path,
    media_kind: kind,
    caption: caption.trim(),
  }).select("id,user_id,media_url,media_kind,caption,expires_at,created_at").single();
  if (result.error) {
    const cleanup = await supabase.storage.from("community-media").remove([uploaded.path]);
    if (cleanup.error) console.error("Could not clean up story media:", cleanup.error);
    throw result.error;
  }
  return result.data;
}

export async function fetchStories() {
  const rows = unwrap(await supabase.from("stories")
    .select("id,user_id,media_url,media_kind,caption,expires_at,created_at,profiles!stories_user_id_fkey(id,full_name,avatar_url),story_views(viewer_id)")
    .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(100));
  return Promise.all(rows.map(async (row) => {
    const media = unwrap(await supabase.storage.from("community-media").createSignedUrl(row.media_url, 3600));
    return {
      id: row.id, author: row.user_id, name: row.profiles?.full_name || "Member",
      avatar: row.profiles?.avatar_url, image: media.signedUrl, caption: row.caption,
      kind: row.media_kind, expiresAt: row.expires_at,
      views: row.story_views?.length || 0,
    };
  }));
}

export async function recordStoryView(storyId, viewerId) {
  const { error } = await supabase.from("story_views").upsert(
    { story_id: storyId, viewer_id: viewerId },
    { onConflict: "story_id,viewer_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function setPostReaction({ postId, userId, kind = "like", remove = false }) {
  if (remove) {
    const { error } = await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("reactions").upsert(
    { post_id: postId, user_id: userId, kind },
    { onConflict: "post_id,user_id" },
  );
  if (error) throw error;
}

export async function createComment({ postId, userId, text, parentId }) {
  return unwrap(await supabase.from("comments").insert({
    post_id: postId,
    user_id: userId,
    parent_id: parentId || null,
    body: text.trim(),
  }).select("id,user_id,body,created_at").single());
}

export async function editComment(commentId, text) {
  const { error } = await supabase.from("comments").update({ body: text.trim(), edited_at: new Date().toISOString() }).eq("id", commentId);
  if (error) throw error;
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function toggleCommentReaction(commentId, userId, liked) {
  if (liked) {
    const { error } = await supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", userId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("comment_reactions").upsert(
    { comment_id: commentId, user_id: userId, kind: "like" },
    { onConflict: "comment_id,user_id" },
  );
  if (error) throw error;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function createConversation(recipientId) {
  return unwrap(await supabase.rpc("start_conversation", { recipient_id: recipientId }));
}

export async function fetchConversations() {
  const participants = unwrap(await supabase.from("conversation_participants")
    .select("conversation_id,user_id,last_read_at")
    .order("last_read_at", { ascending: false }));
  const conversationIds = [...new Set(participants.map((participant) => participant.conversation_id))];
  if (!conversationIds.length) return [];
  const [memberRows, messageRows] = await Promise.all([
    supabase.from("conversation_participants")
      .select("conversation_id,user_id,last_read_at,profiles!conversation_participants_user_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy)")
      .in("conversation_id", conversationIds),
    supabase.from("messages")
      .select("id,conversation_id,sender_id,body,attachment_url,attachment_name,attachment_type,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true }),
  ]);
  if (memberRows.error) throw memberRows.error;
  if (messageRows.error) throw messageRows.error;
  return Promise.all(conversationIds.map(async (conversationId) => ({
    id: conversationId,
    members: memberRows.data.filter((member) => member.conversation_id === conversationId),
    messages: await Promise.all(messageRows.data.filter((message) => message.conversation_id === conversationId)
      .map(async (message) => ({
        ...message,
        attachment_url: message.attachment_url ? await signedMediaURL(message.attachment_url) : null,
      }))),
  })));
}

export async function sendMessage({ conversationId, userId, text, attachmentPath = null, attachmentName = null, attachmentType = null }) {
  return unwrap(await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    body: text.trim(),
    attachment_url: attachmentPath,
    attachment_name: attachmentName,
    attachment_type: attachmentType,
  }).select("id,conversation_id,sender_id,body,attachment_url,attachment_name,attachment_type,created_at").single());
}

export async function markConversationRead(conversationId, userId) {
  const { error } = await supabase.from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function fetchConnections(userId) {
  const requests = unwrap(await supabase.from("friend_requests")
    .select("id,requester_id,addressee_id,status,requester:profiles!friend_requests_requester_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy),addressee:profiles!friend_requests_addressee_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy)")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`));
  const knownIds = new Set([userId]);
  const friends = [];
  const incoming = [];
  const outgoing = [];
  for (const request of requests) {
    const otherId = request.requester_id === userId ? request.addressee_id : request.requester_id;
    const otherProfile = request.requester_id === userId ? request.addressee : request.requester;
    if (otherProfile) knownIds.add(otherProfile.id);
    if (request.status === "accepted") friends.push(otherId);
    if (request.status === "pending" && request.addressee_id === userId) incoming.push(otherId);
    if (request.status === "pending" && request.requester_id === userId) outgoing.push(otherId);
  }
  const suggestionsResult = await supabase.from("profiles").select("id,full_name,avatar_url,bio,cover_url,privacy")
    .neq("id", userId).limit(30);
  if (suggestionsResult.error) throw suggestionsResult.error;
  const suggestions = suggestionsResult.data.filter((profile) => !knownIds.has(profile.id));
  return { requests, friends, incoming, outgoing, suggestions };
}

export async function createFriendRequest(userId, recipientId) {
  return unwrap(await supabase.from("friend_requests").insert({ requester_id: userId, addressee_id: recipientId })
    .select("id,requester_id,addressee_id,status").single());
}

export async function respondFriendRequest(requestId, status) {
  return unwrap(await supabase.from("friend_requests").update({ status }).eq("id", requestId)
    .select("id,requester_id,addressee_id,status").single());
}

export async function cancelFriendRequest(requestId) {
  const { error } = await supabase.from("friend_requests").delete().eq("id", requestId);
  if (error) throw error;
}

export async function removeFriend(userId, friendId) {
  const { error } = await supabase.from("friend_requests").delete().eq("status", "accepted")
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);
  if (error) throw error;
}

export async function toggleFollow(userId, followedId, following) {
  if (following) {
    const { error } = await supabase.from("follows").delete().eq("follower_id", userId).eq("followed_id", followedId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("follows").insert({ follower_id: userId, followed_id: followedId });
  if (error) throw error;
  return true;
}

export async function fetchFollowing(userId) {
  return unwrap(await supabase.from("follows").select("followed_id").eq("follower_id", userId));
}

export async function fetchBlockedUsers(userId) {
  return unwrap(await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", userId));
}

export async function toggleBlock(userId, blockedId, isBlocked) {
  if (isBlocked) {
    const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", userId).eq("blocked_id", blockedId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("user_blocks").insert({ blocker_id: userId, blocked_id: blockedId });
  if (error) throw error;
  return true;
}

export async function fetchNotifications(userId) {
  return unwrap(await supabase.from("notifications")
    .select("id,recipient_id,actor_id,kind,post_id,comment_id,read_at,created_at,actor:profiles!notifications_actor_id_fkey(id,full_name,avatar_url,bio,cover_url,privacy)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(40));
}

export async function markNotificationsRead(userId, notificationId) {
  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId).is("read_at", null);
  if (notificationId) query = query.eq("id", notificationId);
  const { error } = await query;
  if (error) throw error;
}

export function subscribeToNotifications(onChange) {
  const channel = supabase.channel("private-notifications")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToMessages(onChange) {
  const channel = supabase.channel("private-messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_participants" }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToConversation({ conversationId, userId, onPresence, onTyping, onStatus }) {
  const channel = supabase.channel(`conversation:${conversationId}`, {
    config: { private: true, presence: { key: userId } },
  })
    .on("presence", { event: "sync" }, () => {
      const users = Object.values(channel.presenceState()).flat()
        .map((presence) => presence.user_id)
        .filter((id) => typeof id === "string");
      onPresence(users);
    })
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload?.user_id !== userId) onTyping(payload?.typing === true);
    })
    .subscribe(async (status) => {
      onStatus(status);
      if (status === "SUBSCRIBED") {
        const result = await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        if (result !== "ok") onStatus("CHANNEL_ERROR");
      }
    });

  return {
    sendTyping: async (typing) => {
      const result = await channel.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: userId, typing },
      });
      if (result !== "ok") throw new Error(`Could not send typing status (${result}).`);
    },
    unsubscribe: () => { supabase.removeChannel(channel); },
  };
}

export function subscribeToFeed(onChange) {
  const channel = supabase.channel("public-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function profileFromDatabase(profile) {
  return {
    id: profile.id,
    name: profile.full_name || "New member",
    avatar: /^https?:\/\//i.test(profile.avatar_url || "") ? profile.avatar_url : "https://i.pravatar.cc/160?img=12",
    avatarPath: profile.avatar_url && !/^https?:\/\//i.test(profile.avatar_url) ? profile.avatar_url : "",
    cover: /^https?:\/\//i.test(profile.cover_url || "") ? profile.cover_url : "",
    coverPath: profile.cover_url && !/^https?:\/\//i.test(profile.cover_url) ? profile.cover_url : "",
    bio: profile.bio || "",
    education: profile.education || "",
    work: profile.work || "",
    location: profile.location || "",
    website: profile.website || "",
    privacy: profile.privacy || "public",
    role: profile.role || "user",
  };
}
