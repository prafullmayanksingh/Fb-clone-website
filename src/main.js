import { currentUser, people, initialPosts, initialChats, groups, products, stories } from "./data.js";
import {
  backendConfigured,
  cancelFriendRequest,
  createConversation,
  createFriendRequest,
  createComment,
  createPost,
  createGroup,
  createPage,
  createStory,
  createReport,
  deleteComment,
  deletePost,
  editComment,
  fetchConnections,
  fetchConversations,
  fetchBlockedUsers,
  fetchFollowing,
  fetchFeed,
  fetchGroups,
  fetchGroupRequests,
  fetchGroupPosts,
  fetchPages,
  fetchPagePosts,
  fetchPageAnalytics,
  fetchNotifications,
  fetchStories,
  fetchSavedPosts,
  fetchTrendingHashtags,
  getProfile,
  getSession,
  onAuthChange,
  profileFromDatabase,
  removeFriend,
  saveProfile,
  savePost,
  sendMessage,
  sendPasswordReset,
  markNotificationsRead,
  markConversationRead,
  removeMedia,
  respondFriendRequest,
  setPostReaction,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  searchCommunity,
  signedMediaURL,
  subscribeToFeed,
  subscribeToConversation,
  subscribeToMessages,
  subscribeToNotifications,
  toggleFollow,
  toggleBlock,
  toggleCommentReaction,
  joinGroup,
  leaveGroup,
  requestGroupMembership,
  reviewGroupJoinRequest,
  recordStoryView,
  togglePageFollow,
  togglePinPost,
  updatePost,
  updatePassword,
  uploadMedia,
  votePostPoll,
} from "./supabase.js";
import "./styles.css";

const STORAGE_KEY = "community-clone-state-v1";
const peopleById = Object.fromEntries(people.map((person) => [person.id, person]));
const reactionOptions = [
  { kind: "like", emoji: "👍", label: "Like" },
  { kind: "love", emoji: "❤️", label: "Love" },
  { kind: "haha", emoji: "😂", label: "Haha" },
  { kind: "wow", emoji: "😮", label: "Wow" },
  { kind: "sad", emoji: "😢", label: "Sad" },
  { kind: "angry", emoji: "😡", label: "Angry" },
];
const messageAttachmentTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm",
  "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm",
  "application/pdf", "text/plain", "text/csv", "application/zip", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const iconPaths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  friends: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
  store: '<path d="m3 9 2-6h14l2 6"/><path d="M4 9v11h16V9M9 20v-7h6v7"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  group: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6V20"/>',
  bookmark: '<path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  paperclip: '<path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
  microphone: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  like: '<path d="M7 10v12H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm0 0 5-8a3 3 0 0 1 2 3l-1 5h6a3 3 0 0 1 3 4l-2 7a3 3 0 0 1-3 2H7"/>',
  comment: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  share: '<path d="M12 16V3m-5 5 5-5 5 5"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/>',
  photo: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="m8 5 12 7-12 7z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
};

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.more}</svg>`;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function imageURL(value) {
  const url = String(value || "");
  return /^(https?:\/\/|data:image\/(jpeg|png|gif|webp);base64,|data:video\/(mp4|webm);base64,)/i.test(url) ? escapeHTML(url) : "";
}

function loadState() {
  const defaults = {
    posts: initialPosts.map((post) => ({ ...post, comments: [...post.comments] })),
    incoming: ["sam", "olivia"],
    outgoing: [],
    friends: ["maya", "jordan", "sofia"],
    friendRequests: [],
    suggestions: people,
    following: [],
    blocked: [],
    communities: groups.map((group) => ({ ...group, joined: false })),
    pages: [],
    pageAnalytics: {},
    activeGroup: null,
    activePage: null,
    groupRequests: [],
    storyItems: [],
    pagePosts: [],
    groupPosts: [],
    trendingHashtags: [],
    searchResults: null,
    feedOffset: 0,
    hasMorePosts: true,
    chats: initialChats.map((chat) => ({ ...chat, messages: [...chat.messages] })),
    joinedGroups: [],
    cart: [],
    savedProducts: [],
    saved: [],
    notifications: [
      { id: "n-1", text: "Maya Chen and 3 others reacted to your photo.", time: "12 min", read: false, person: "maya" },
      { id: "n-2", text: "Jordan Lee commented on your post.", time: "1 hr", read: false, person: "jordan" },
      { id: "n-3", text: "Sofia Rivera invited you to Weekend Hikers.", time: "Yesterday", read: true, person: "sofia" },
    ],
    profile: { ...currentUser },
    dark: false,
    authUser: null,
    profiles: {},
    remoteReady: false,
    authBusy: false,
    authMessage: "",
  };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored) return defaults;
    if (backendConfigured) return { ...defaults, dark: Boolean(stored.dark) };
    return { ...defaults, ...stored };
  } catch (error) {
    console.error("Could not load saved app data:", error);
    return defaults;
  }
}

const state = loadState();
const ui = { view: "home", profileId: "you", profileTab: "Posts", marketTab: "For you", feedFilter: "all", searchKind: "all", chatId: null, chatOnline: false, chatTyping: false, modal: null, noticeOpen: false, menuPost: null, search: "" };
const app = document.querySelector("#app");

function save() {
  try {
    if (backendConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dark: state.dark }));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save app data:", error);
    toast("Your browser could not save this update.");
  }
}

function person(id) {
  if (id === "you") return state.profile;
  return state.profiles[id] || peopleById[id] || people[0];
}

function avatar(id, size = "", extra = "") {
  const user = person(id);
  return `<img class="avatar ${size} ${extra}" src="${imageURL(user.avatar)}" alt="${escapeHTML(user.name)}" />`;
}

function postText(text) {
  return escapeHTML(text).replace(/(^|[\s])#([a-zA-Z0-9_]{1,50})/g, (match, prefix, tag) =>
    `${prefix}<button class="hashtag-link" data-action="search-hashtag" data-tag="${escapeHTML(tag)}">#${escapeHTML(tag)}</button>`);
}

function navItem(view, label, iconName, extra = "") {
  return `<button class="nav-item ${ui.view === view ? "active" : ""} ${extra}" data-action="navigate" data-view="${view}">${icon(iconName, 22)}<span>${label}</span></button>`;
}

function header() {
  const unread = state.notifications.filter((item) => !item.read).length;
  const unreadMessages = state.chats.reduce((total, chat) => total + (chat.unread || 0), 0);
  return `<header class="topbar">
    <div class="brand-area"><button class="brand-mark" data-action="navigate" data-view="home" aria-label="Facebook home">f</button>
      <form class="search-form" id="search-form">${icon("search", 18)}<input name="query" type="search" placeholder="Search Facebook" value="${escapeHTML(ui.search)}" aria-label="Search Facebook"></form></div>
    <nav class="top-nav" aria-label="Main navigation">
      <button class="top-nav-item ${ui.view === "home" ? "selected" : ""}" data-action="navigate" data-view="home" aria-label="Home">${icon("home", 24)}</button>
      <button class="top-nav-item ${ui.view === "friends" ? "selected" : ""}" data-action="navigate" data-view="friends" aria-label="Friends">${icon("friends", 24)}</button>
      <button class="top-nav-item ${ui.view === "watch" ? "selected" : ""}" data-action="navigate" data-view="watch" aria-label="Watch">${icon("video", 24)}</button>
      <button class="top-nav-item ${ui.view === "marketplace" ? "selected" : ""}" data-action="navigate" data-view="marketplace" aria-label="Marketplace">${icon("store", 24)}</button>
      <button class="top-nav-item ${ui.view === "groups" ? "selected" : ""}" data-action="navigate" data-view="groups" aria-label="Groups">${icon("group", 24)}</button>
    </nav>
    <div class="top-actions">
      <button class="icon-button mobile-menu" data-action="toggle-mobile-menu" aria-label="Open menu">${icon("menu")}</button>
      <button class="icon-button" data-action="toggle-theme" aria-label="Toggle dark mode">${icon("moon")}</button>
      <button class="icon-button ${ui.noticeOpen ? "pressed" : ""}" data-action="toggle-notifications" aria-label="Notifications">${icon("bell")} ${unread ? `<span class="badge">${unread}</span>` : ""}</button>
      <button class="icon-button ${ui.chatId ? "pressed" : ""}" data-action="toggle-chat" aria-label="Messenger">${icon("message")} ${unreadMessages ? `<span class="badge">${unreadMessages}</span>` : ""}</button>
      ${state.authUser ? `<button class="icon-button signout-button" data-action="sign-out" aria-label="Sign out">${icon("close")}</button>` : ""}
      <button class="profile-chip" data-action="navigate-profile" data-id="you">${avatar("you", "avatar-small")}<span>${escapeHTML(state.profile.name.split(" ")[0])}</span></button>
    </div>
    ${ui.noticeOpen ? notificationMenu() : ""}
  </header>`;
}

function authView() {
  const mode = ui.authMode || "login";
  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  const isUpdate = mode === "update-password";
  const title = isSignup ? "Create your account" : isReset ? "Reset your password" : isUpdate ? "Choose a new password" : "Welcome back";
  const description = isSignup ? "Join your community and stay connected." : isReset ? "We’ll email you a secure password reset link." : isUpdate ? "Choose a strong password for your account." : "Sign in to see what your friends are sharing.";
  return `<main class="auth-screen"><section class="auth-brand"><div class="brand-mark">f</div><h1>Connect with your community.</h1><p>Share what matters, catch up with friends, and find your people.</p></section>
    <section class="auth-card panel"><h2>${title}</h2><p>${description}</p>
      ${ui.authMessage ? `<div class="auth-message ${ui.authError ? "error" : ""}" role="status">${escapeHTML(ui.authMessage)}</div>` : ""}
      <form id="auth-form">
        ${isSignup ? '<label>Your name<input name="name" autocomplete="name" maxlength="80" required></label>' : ""}
        ${isUpdate ? "" : '<label>Email address<input name="email" type="email" autocomplete="email" maxlength="254" required></label>'}
        ${!isReset ? `<label>${isUpdate ? "New password" : "Password"}<input name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" minlength="10" maxlength="128" required></label>` : ""}
        ${!isReset && !isUpdate ? `<button class="primary-button auth-submit" type="submit" ${state.authBusy ? "disabled" : ""}>${state.authBusy ? "Please wait…" : isSignup ? "Create account" : "Log in"}</button>` : ""}
        ${isReset ? `<button class="primary-button auth-submit" type="submit" ${state.authBusy ? "disabled" : ""}>${state.authBusy ? "Please wait…" : "Send reset link"}</button>` : ""}
        ${isUpdate ? `<button class="primary-button auth-submit" type="submit" ${state.authBusy ? "disabled" : ""}>${state.authBusy ? "Please wait…" : "Update password"}</button>` : ""}
      </form>
      ${!isReset && !isUpdate && !isSignup ? '<button class="text-action forgot-link" data-action="auth-mode" data-mode="reset">Forgot password?</button>' : ""}
      ${!isReset && !isUpdate ? `<div class="auth-divider"><span>or</span></div>${!isSignup ? `<button class="google-button secondary-button" data-action="google-login" ${state.authBusy ? "disabled" : ""}><span class="google-g">G</span> Continue with Google</button>` : ""}<button class="secondary-button auth-submit" data-action="auth-mode" data-mode="${isSignup ? "login" : "signup"}">${isSignup ? "Already have an account? Log in" : "Create new account"}</button>` : '<button class="text-action" data-action="auth-mode" data-mode="login">Back to login</button>'}
      <small class="auth-legal">By continuing, you agree to use this community respectfully. Your account is secured by Supabase.</small>
    </section>
  </main>`;
}

function notificationMenu() {
  return `<section class="floating-menu notification-menu"><div class="menu-heading"><h2>Notifications</h2><button class="text-action" data-action="mark-read">Mark all read</button></div>
    ${state.notifications.map((item) => `<button class="notification-row ${item.read ? "" : "unread"}" data-action="open-notification" data-person="${item.person}" data-notification="${item.id}">${avatar(item.person, "avatar-small")}<span><b>${escapeHTML(item.text)}</b><small>${escapeHTML(item.time)}</small></span>${item.read ? "" : '<i class="unread-dot"></i>'}</button>`).join("")}
    ${state.notifications.length ? "" : '<p class="empty-note">You’re all caught up.</p>'}
  </section>`;
}

function sidebar() {
  return `<aside class="left-sidebar">
    <button class="sidebar-profile" data-action="navigate-profile" data-id="you">${avatar("you")}<strong>${escapeHTML(state.profile.name)}</strong></button>
    ${navItem("friends", "Friends", "friends")}
    ${navItem("saved", "Saved", "bookmark")}
    ${navItem("groups", "Groups", "group")}
    ${navItem("pages", "Pages", "group")}
    ${navItem("watch", "Watch", "video")}
    ${navItem("marketplace", "Marketplace", "store")}
    <div class="sidebar-rule"></div>
    <div class="sidebar-section-title"><span>Your shortcuts</span><button class="subtle-link" data-action="navigate" data-view="groups">Edit</button></div>
    ${groups.slice(0, 3).map((group) => `<button class="shortcut-row" data-action="navigate" data-view="groups"><img src="${imageURL(group.image)}" alt=""><span>${escapeHTML(group.name)}</span></button>`).join("")}
    <footer class="sidebar-footer">Privacy · Terms · Advertising · Cookies · More<br>Facebook Clone © 2025</footer>
  </aside>`;
}

function rightSidebar() {
  const suggestions = state.suggestions.filter((p) => !state.friends.includes(p.id) && !state.outgoing.includes(p.id)).slice(0, 3);
  const onlineFriends = state.friends.map(person).slice(0, 5);
  return `<aside class="right-sidebar">
    <div class="right-section-title"><h3>Friend requests</h3><button class="subtle-link" data-action="navigate" data-view="friends">See all</button></div>
    ${state.incoming.slice(0, 2).map((id) => { const request = state.friendRequests.find((item) => item.requester_id === id && item.addressee_id === state.authUser?.id); return `<div class="request-card">${avatar(id)}<div class="request-info"><strong>${escapeHTML(person(id).name)}</strong><small>${person(id).mutuals || 4} mutual friends</small><div class="request-actions"><button class="primary-button small" data-action="accept-friend" data-id="${id}" data-request-id="${request?.id || ""}">Confirm</button><button class="secondary-button small" data-action="decline-friend" data-id="${id}" data-request-id="${request?.id || ""}">Delete</button></div></div></div>`; }).join("")}
    ${state.incoming.length ? '<div class="sidebar-rule"></div>' : ""}
    <div class="right-section-title"><h3>People you may know</h3><button class="subtle-link" data-action="navigate" data-view="friends">See all</button></div>
    ${suggestions.map((p) => `<div class="suggestion-row">${avatar(p.id)}<div><strong>${escapeHTML(p.name)}</strong><small>${p.mutuals} mutual friends</small><button class="soft-button" data-action="add-friend" data-id="${p.id}">${icon("plus", 15)} Add friend</button></div></div>`).join("")}
    <div class="sidebar-rule"></div>
    <div class="right-section-title"><h3>Contacts</h3><div class="contact-tools"><button class="plain-icon" data-action="open-chat" data-id="maya" aria-label="New message">${icon("search", 17)}</button><button class="plain-icon" data-action="toggle-chat" aria-label="More contacts">${icon("more", 18)}</button></div></div>
    ${onlineFriends.map((p) => `<button class="contact-row" data-action="open-chat" data-id="${p.id}">${avatar(p.id, "avatar-small")}<span class="online-dot"></span><strong>${escapeHTML(p.name)}</strong></button>`).join("")}
  </aside>`;
}

function storiesRow() {
  const activeStories = state.storyItems.filter((story) => new Date(story.expiresAt).getTime() > Date.now());
  const uniqueStories = [...new Map(activeStories.map((story) => [story.author, story])).values()];
  return `<section class="stories-panel panel"><button class="story-card create-story" data-action="open-composer"><div class="story-create-image">${avatar("you")}</div><span class="story-plus">${icon("plus", 18)}</span><strong>Create story</strong><small>Share a moment</small></button>
    <button class="story-card add-story-card" data-action="create-story"><span>${icon("plus", 25)}</span><strong>Add a story</strong><small>Photos or videos · expires in 24h</small></button>
    ${uniqueStories.map((story) => `<button class="story-card story-photo" data-action="open-story" data-id="${story.id}" style="--story-image:url('${imageURL(story.image)}')"><img src="${imageURL(story.avatar || person(story.author).avatar)}" alt="" class="story-avatar"><strong>${escapeHTML(story.name || person(story.author).name)}</strong></button>`).join("")}
    ${uniqueStories.length ? "" : stories.slice(0, 3).map((story) => `<button class="story-card story-photo" data-action="open-story" data-id="${story.id}" style="--story-image:url('${imageURL(story.image)}')"><img src="${imageURL(story.avatar)}" alt="" class="story-avatar"><strong>${escapeHTML(story.name)}</strong></button>`).join("")}
  </section>`;
}

function composer() {
  return `<section class="composer panel"><div class="composer-top">${avatar("you")}<button class="composer-input" data-action="open-composer">What’s on your mind, ${escapeHTML(state.profile.name.split(" ")[0])}?</button></div><div class="composer-divider"></div>
    <div class="composer-options"><button data-action="open-composer" data-mode="photo">${icon("photo", 21)}<span>Photo/video</span></button><button data-action="open-composer" data-mode="feeling">${icon("smile", 21)}<span>Feeling/activity</span></button><button data-action="open-composer">${icon("video", 21)}<span class="hide-small">Live video</span></button></div>
  </section>`;
}

function commentCard(comment, postId) {
  const selfId = state.authUser?.id || "you";
  const isOwnComment = comment.author === selfId;
  if (ui.editCommentId === comment.id) {
    return `<form class="comment-edit-form" data-comment="${escapeHTML(comment.id)}" data-post="${escapeHTML(postId)}">${avatar("you", "avatar-small")}<textarea name="comment" maxlength="2000" required>${escapeHTML(comment.text)}</textarea><button type="submit" class="primary-button small">Save</button><button type="button" class="secondary-button small" data-action="cancel-comment-edit">Cancel</button></form>`;
  }
  return `<div class="comment-row ${comment.parentId ? "nested-comment" : ""}">${avatar(comment.author, "avatar-small")}<div class="comment-bubble"><button class="author-name" data-action="navigate-profile" data-id="${escapeHTML(comment.author)}">${escapeHTML(person(comment.author).name)}</button><p>${escapeHTML(comment.text)}</p><small>${escapeHTML(comment.time || "Just now")}</small><div class="comment-tools"><button class="${comment.liked ? "is-liked" : ""}" data-action="comment-reaction" data-id="${escapeHTML(comment.id)}" data-post="${escapeHTML(postId)}">👍 ${comment.likes || 0}</button><button data-action="reply-comment" data-id="${escapeHTML(comment.id)}" data-post="${escapeHTML(postId)}">Reply</button>${isOwnComment ? `<button data-action="edit-comment" data-id="${escapeHTML(comment.id)}">Edit</button><button data-action="delete-comment" data-id="${escapeHTML(comment.id)}" data-post="${escapeHTML(postId)}">Delete</button>` : ""}</div></div></div>`;
}

function pollCard(post) {
  if (!post.poll?.options?.length) return "";
  const totalVotes = post.poll.options.reduce((total, option) => total + option.votes, 0);
  const hasVoted = Boolean(post.poll.ownOptionId);
  return `<section class="post-poll" aria-label="Poll"><strong>Poll · ${totalVotes} ${totalVotes === 1 ? "vote" : "votes"}</strong>${post.poll.options.map((option) => {
    const percent = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
    const selected = post.poll.ownOptionId === option.id;
    return `<button type="button" class="poll-option ${selected ? "selected" : ""}" data-action="vote-poll" data-id="${escapeHTML(post.id)}" data-option="${escapeHTML(option.id)}" ${hasVoted ? "disabled" : ""}><span>${escapeHTML(option.text)}</span>${hasVoted ? `<strong>${percent}%</strong><span class="poll-result" style="width:${percent}%"></span>` : ""}</button>`;
  }).join("")}<small>${hasVoted ? "You voted" : "Choose one option"}</small></section>`;
}

function postCard(post) {
  const author = person(post.author);
  const comments = post.comments || [];
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];
  const myReaction = reactionOptions.find((reaction) => reaction.kind === post.reactionKind) || reactionOptions[0];
  const isOwner = state.authUser ? post.author === state.authUser.id : post.author === "you";
  return `<article class="post-card panel" data-post="${escapeHTML(post.id)}">
    <div class="post-heading">${avatar(post.author)}<div class="post-meta"><button class="author-name" data-action="navigate-profile" data-id="${escapeHTML(post.author)}">${escapeHTML(author.name)}</button><span>${escapeHTML(post.time || "Just now")} · ${icon("globe", 13)}</span></div>
      <button class="plain-icon post-more" data-action="post-menu" data-id="${escapeHTML(post.id)}" aria-label="Post options">${icon("more")}</button>
      ${ui.menuPost === post.id ? `<div class="post-menu floating-menu"><button data-action="save-post" data-id="${escapeHTML(post.id)}">${icon("bookmark", 17)} ${state.saved.includes(post.id) ? "Remove from saved" : "Save post"}</button>${isOwner ? `<button data-action="edit-post" data-id="${escapeHTML(post.id)}">${icon("edit", 17)} Edit post</button><button data-action="pin-post" data-id="${escapeHTML(post.id)}">${icon("plus", 17)} ${post.pinned ? "Unpin post" : "Pin post"}</button><button data-action="delete-post" data-id="${escapeHTML(post.id)}">${icon("close", 17)} Delete post</button>` : `<button data-action="report-post" data-id="${escapeHTML(post.id)}">${icon("bookmark", 17)} Report post</button>`}</div>` : ""}
    </div>
    ${post.pinned ? '<span class="pinned-label">📌 Pinned</span>' : ""}
    ${post.text ? `<p class="post-copy">${postText(post.text).replace(/\n/g, "<br>")}</p>` : ""}
    ${images.length === 1 ? `<img class="post-image" src="${imageURL(images[0])}" alt="Photo shared by ${escapeHTML(author.name)}" loading="lazy">` : images.length > 1 ? `<div class="post-media-grid count-${Math.min(images.length, 4)}">${images.slice(0, 4).map((src, index) => `<img class="post-image" src="${imageURL(src)}" alt="Photo ${index + 1} shared by ${escapeHTML(author.name)}" loading="lazy">`).join("")}${images.length > 4 ? `<span class="media-overflow">+${images.length - 4}</span>` : ""}</div>` : ""}
    ${pollCard(post)}
    <div class="post-stats"><span class="reaction-count"><span class="like-reaction">${post.likes ? myReaction.emoji : "👍"}</span><span>${post.likes || 0}</span></span><button data-action="toggle-comments" data-id="${escapeHTML(post.id)}">${comments.length} ${comments.length === 1 ? "comment" : "comments"}</button><span>${post.shares || 0} shares</span></div>
    <div class="post-actions"><div class="reaction-control"><button class="${post.liked ? "is-liked" : ""}" data-action="like-post" data-id="${escapeHTML(post.id)}" aria-label="${post.liked ? myReaction.label : "Like"}">${icon("like", 19)} ${post.liked ? myReaction.label : "Like"}</button><button class="reaction-menu-trigger" data-action="show-reactions" data-id="${escapeHTML(post.id)}" aria-label="Choose a reaction">⌄</button></div><button data-action="toggle-comments" data-id="${escapeHTML(post.id)}">${icon("comment", 19)} Comment</button><button data-action="share-post" data-id="${escapeHTML(post.id)}">${icon("share", 19)} Share</button></div>
    ${ui.reactionPost === post.id ? `<div class="reaction-picker">${reactionOptions.map((reaction) => `<button data-action="set-reaction" data-id="${escapeHTML(post.id)}" data-kind="${reaction.kind}" aria-label="${reaction.label}" title="${reaction.label}">${reaction.emoji}</button>`).join("")}</div>` : ""}
    ${ui.expandedComments?.includes(post.id) ? `<div class="comments-area">${comments.map((comment) => commentCard(comment, post.id)).join("")}
      ${ui.replyToPost === post.id ? `<div class="replying-to">Replying to ${escapeHTML(person(comments.find((comment) => comment.id === ui.replyTo)?.author || "you").name)} <button data-action="cancel-reply" aria-label="Cancel reply">${icon("close", 13)}</button></div>` : ""}
      <form class="comment-form" data-post="${escapeHTML(post.id)}" data-parent="${ui.replyToPost === post.id ? escapeHTML(ui.replyTo || "") : ""}">${avatar("you", "avatar-small")}<div class="comment-input-wrap"><input name="comment" placeholder="${ui.replyToPost === post.id ? "Write a reply…" : "Write a comment…"}" maxlength="2000" aria-label="Write a comment"><button type="submit" aria-label="Send comment">${icon("send", 17)}</button></div></form></div>` : ""}
  </article>`;
}

function homeView() {
  let posts = state.posts.filter((post) => !ui.search || `${person(post.author).name} ${post.text}`.toLowerCase().includes(ui.search.toLowerCase()));
  if (ui.feedFilter === "friends") posts = posts.filter((post) => state.friends.includes(post.author) || post.author === "you" || post.author === state.authUser?.id);
  if (ui.feedFilter === "trending") posts = [...posts].sort((left, right) => (right.likes + right.comments.length * 2) - (left.likes + left.comments.length * 2));
  if (ui.feedFilter === "recommended") posts = [...posts].sort((left, right) => right.comments.length - left.comments.length);
  return `<div class="feed-column">${backendConfigured ? '<div class="connection-banner">☁ Shared community feed is connected. Posts and reactions sync across accounts.</div>' : '<div class="connection-banner demo">Demo mode · Configure Supabase to enable accounts and shared data.</div>'}${ui.search ? `<div class="search-result-label">Search results for <strong>“${escapeHTML(ui.search)}”</strong><button class="text-action" data-action="clear-search">Clear</button></div>` : ""}
    ${storiesRow()}${composer()}<div class="trending-tags">${state.trendingHashtags.map((item) => `<button class="hashtag-chip" data-action="search-hashtag" data-tag="${escapeHTML(item.tag)}">#${escapeHTML(item.tag)} <small>${item.count}</small></button>`).join("")}</div><div class="feed-heading"><h2>Most recent</h2><div class="feed-filters"><button class="feed-filter ${ui.feedFilter === "all" ? "selected" : ""}" data-action="feed-filter" data-filter="all">For you</button><button class="feed-filter ${ui.feedFilter === "friends" ? "selected" : ""}" data-action="feed-filter" data-filter="friends">Friends</button><button class="feed-filter ${ui.feedFilter === "trending" ? "selected" : ""}" data-action="feed-filter" data-filter="trending">Trending</button></div></div>
    ${posts.length ? posts.map(postCard).join("") : '<section class="panel empty-state"><h2>No posts found</h2><p>Try another search or check back later.</p></section>'}
    ${backendConfigured && state.hasMorePosts ? '<div class="feed-sentinel" aria-label="Loading more posts"></div>' : ""}
  </div>`;
}

function searchView() {
  const results = state.searchResults;
  if (!backendConfigured || !results) return homeView();
  const show = (type) => ui.searchKind === "all" || ui.searchKind === type;
  return `<section class="page-content">${pageHeading(`Results for ${escapeHTML(ui.search)}`, "Search people, groups, posts, and hashtags.")}<div class="search-tabs">${["all", "posts", "people", "groups"].map((kind) => `<button class="${ui.searchKind === kind ? "selected" : ""}" data-action="search-kind" data-kind="${kind}">${kind === "all" ? "All results" : kind[0].toUpperCase() + kind.slice(1)}</button>`).join("")}</div>
    ${show("people") && results.people.length ? `<div class="section-heading"><h2>People</h2></div><div class="search-people">${results.people.map((profile) => `<button class="search-person panel" data-action="navigate-profile" data-id="${profile.id}">${avatar(profile.id, "avatar-small")}<span><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(profile.bio || "Community member")}</small></span>${icon("arrow", 16)}</button>`).join("")}</div>` : ""}
    ${show("groups") && results.groups.length ? `<div class="section-heading"><h2>Groups</h2></div><div class="search-groups">${results.groups.map((group) => `<button class="search-group panel" data-action="open-group" data-id="${group.id}"><strong>${escapeHTML(group.name)}</strong><small>${escapeHTML(group.description || "Community group")}</small></button>`).join("")}</div>` : ""}
    ${show("posts") ? `<div class="section-heading"><h2>Posts <span class="muted-count">${results.posts.length}</span></h2></div>${results.posts.length ? results.posts.map(postCard).join("") : '<div class="panel empty-state"><h2>No matching posts</h2><p>Try another name, phrase, or hashtag.</p></div>'}` : ""}
  </section>`;
}

function pageHeading(title, description = "") {
  return `<div class="page-heading"><div><h1>${title}</h1>${description ? `<p>${description}</p>` : ""}</div></div>`;
}

function friendsView() {
  const requests = state.incoming;
  const suggestions = state.suggestions.filter((p) => !state.friends.includes(p.id) && !requests.includes(p.id));
  const friends = state.friends.map((id) => person(id));
  return `<section class="page-content">${pageHeading("Friends", "Keep up with the people who make life better.")}
    ${requests.length ? `<div class="section-heading"><h2>Friend requests</h2><span class="count-pill">${requests.length}</span></div><div class="people-grid">${requests.map((id) => friendCard(person(id), "request")).join("")}</div>` : ""}
    <div class="section-heading"><h2>People you may know</h2></div><div class="people-grid">${suggestions.map((p) => friendCard(p, state.outgoing.includes(p.id) ? "sent" : "suggestion")).join("")}</div>
    <div class="section-heading"><h2>Your friends <span class="muted-count">${friends.length}</span></h2></div><div class="people-grid">${friends.map((p) => friendCard(p, "friend")).join("")}</div>
  </section>`;
}

function friendCard(p, mode) {
  const request = state.friendRequests.find((item) => item.requester_id === p.id || item.addressee_id === p.id);
  const requestAttributes = request ? `data-request-id="${request.id}"` : "";
  const action = mode === "request" ? `<button class="primary-button" data-action="accept-friend" data-id="${p.id}" ${requestAttributes}>Confirm</button><button class="secondary-button" data-action="decline-friend" data-id="${p.id}" ${requestAttributes}>Delete</button>` :
    mode === "friend" ? `<button class="secondary-button" data-action="open-chat" data-id="${p.id}">${icon("message", 16)} Message</button>${backendConfigured ? `<button class="secondary-button" data-action="unfriend" data-id="${p.id}">Unfriend</button>` : ""}` :
      `<button class="${mode === "sent" ? "secondary-button" : "primary-button"}" data-action="${mode === "sent" ? "cancel-request" : "add-friend"}" data-id="${p.id}" ${requestAttributes}>${mode === "sent" ? "Request sent" : `${icon("plus", 16)} Add friend`}</button>`;
  return `<article class="person-card panel"><img src="${imageURL(p.avatar)}" alt="${escapeHTML(p.name)}" class="person-card-image"><div class="person-card-info"><button class="author-name" data-action="navigate-profile" data-id="${p.id}">${escapeHTML(p.name)}</button><small>${mode === "friend" ? escapeHTML(p.note) : `${p.mutuals} mutual friends`}</small><div class="person-card-actions">${action}</div></div></article>`;
}

function watchView() {
  const videos = [
    { title: "A quiet morning in the mountains", creator: "Nature, every day", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85", views: "18K views · 2 days ago" },
    { title: "The perfect weekend sourdough", creator: "The Home Kitchen", image: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=1200&q=85", views: "4.2K views · 5 days ago" },
    { title: "Tiny garden, big harvest 🌱", creator: "Growing Together", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85", views: "9.1K views · 1 week ago" },
  ];
  return `<section class="page-content">${pageHeading("Watch", "Videos picked for you.")}<div class="video-grid">${videos.map((video) => `<article class="video-card panel"><button class="video-thumb" data-action="play-video" data-title="${escapeHTML(video.title)}" style="--video-image:url('${imageURL(video.image)}')"><span class="play-button">${icon("play", 24)}</span></button><div class="video-info"><span class="video-channel">${escapeHTML(video.creator[0])}</span><div><h2>${escapeHTML(video.title)}</h2><small>${escapeHTML(video.views)}</small></div><button class="plain-icon" data-action="share-video" data-title="${escapeHTML(video.title)}" aria-label="Share video">${icon("more")}</button></div></article>`).join("")}</div></section>`;
}

function marketplaceView() {
  const categories = ["For you", "Electronics", "Furniture", "Home & garden", "Saved"];
  const visibleProducts = ui.marketTab === "For you"
    ? products
    : ui.marketTab === "Saved"
      ? products.filter((product) => state.savedProducts.includes(product.id))
      : products.filter((product) => product.category === ui.marketTab);
  return `<section class="page-content">${pageHeading("Marketplace", "Discover great finds from people nearby.")}
    <div class="market-toolbar"><div class="market-location">${icon("pin", 17)} New York, New York <button data-action="change-location">Change</button></div><div class="market-categories">${categories.map((category) => `<button class="${ui.marketTab === category ? "selected" : ""}" data-action="market-tab" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join("")}</div></div>
    <div class="section-heading"><h2>${ui.marketTab === "For you" ? "Today's picks" : escapeHTML(ui.marketTab)}</h2><span class="muted-count">${visibleProducts.length} listings</span></div><div class="product-grid">
      ${visibleProducts.map((product) => `<article class="product-card panel"><button class="product-image" data-action="product-detail" data-id="${product.id}"><img src="${imageURL(product.image)}" alt="${escapeHTML(product.title)}" loading="lazy"></button><div class="product-info"><strong>${escapeHTML(product.price)}</strong><span>${escapeHTML(product.title)}</span><small>${icon("pin", 13)} ${escapeHTML(product.location)}</small><div class="product-actions"><button class="secondary-button" data-action="add-cart" data-id="${product.id}">${state.cart.includes(product.id) ? `${icon("check", 16)} Added` : `${icon("cart", 16)} Add to bag`}</button><button class="plain-icon ${state.savedProducts.includes(product.id) ? "saved" : ""}" data-action="save-product" data-id="${product.id}" aria-label="${state.savedProducts.includes(product.id) ? "Remove saved item" : "Save item"}">${icon("bookmark", 17)}</button></div></div></article>`).join("")}
    </div>${visibleProducts.length ? "" : '<section class="panel empty-state"><h2>No saved listings yet</h2><p>Save a marketplace item to find it here.</p><button class="primary-button" data-action="market-tab" data-category="For you">Browse listings</button></section>'}<div class="market-cart">${icon("cart", 18)} ${state.cart.length} ${state.cart.length === 1 ? "item" : "items"} in your bag</div>
  </section>`;
}

function groupsView() {
  const communities = state.communities;
  return `<section class="page-content">${pageHeading("Groups", "Connect with people who share your interests.")}<div class="groups-banner panel"><div><span class="eyebrow">YOUR COMMUNITY</span><h2>Find your people.</h2><p>Join conversations, share what you love, and make something great together.</p></div><div class="groups-toolbar"><button class="secondary-button" data-action="create-group">Create group</button><button class="primary-button" data-action="open-groups-search">${icon("search", 17)} Discover groups</button></div></div>
    <div class="section-heading"><h2>Your groups</h2></div>${communities.some((group) => group.joined) ? `<div class="group-pills">${communities.filter((group) => group.joined).map((group) => `<button class="${ui.activeGroup === group.id ? "selected" : ""}" data-action="open-group" data-id="${escapeHTML(group.id)}">${escapeHTML(group.name)}</button>`).join("")}</div>` : ""}
    <div class="section-heading"><h2>${backendConfigured ? "Communities" : "Groups you might like"}</h2></div><div class="groups-grid">${communities.map((group) => `<article class="group-card panel"><button class="group-cover-button" data-action="open-group" data-id="${escapeHTML(group.id)}"><img src="${imageURL(group.image || "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80")}" alt="" class="group-cover"></button><div class="group-info"><span class="eyebrow">${escapeHTML(group.category || (group.is_public ? "Public group" : "Private group"))}</span><button class="group-title" data-action="open-group" data-id="${escapeHTML(group.id)}">${escapeHTML(group.name)}</button><small>${escapeHTML(group.members || "New community")} · ${group.is_public === false ? "Private" : "Public"}</small>${groupMembershipButton(group)}</div></article>`).join("")}</div>
    ${ui.activeGroup && backendConfigured ? groupDetailView() : ""}
  </section>`;
}

function groupMembershipButton(group) {
  const id = escapeHTML(group.id);
  if (!backendConfigured) {
    const joined = state.joinedGroups.includes(group.id);
    return `<button class="${joined ? "secondary-button" : "primary-button"}" data-action="join-group" data-id="${id}">${joined ? `${icon("check", 17)} Joined` : "Join group"}</button>`;
  }
  if (group.joined) {
    const owner = group.owner_id === state.authUser?.id;
    return owner
      ? `<button class="secondary-button" data-action="open-group" data-id="${id}">Manage group</button>`
      : `<button class="secondary-button" data-action="leave-group" data-id="${id}">${icon("check", 17)} ${group.role === "admin" ? "Admin" : "Joined"}</button>`;
  }
  if (group.is_public) return `<button class="primary-button" data-action="join-group" data-id="${id}">Join group</button>`;
  if (group.requestStatus === "pending") return '<button class="secondary-button" disabled>Request pending</button>';
  return `<button class="primary-button" data-action="request-group" data-id="${id}">${group.requestStatus === "rejected" ? "Request again" : "Request to join"}</button>`;
}

function groupDetailView() {
  const group = state.communities.find((item) => item.id === ui.activeGroup);
  if (!group) return "";
  const posts = state.groupPosts.filter((post) => post.groupId === group.id);
  const canManage = group.owner_id === state.authUser?.id;
  const requests = state.groupRequests.filter((request) => request.group_id === group.id);
  return `<section class="group-detail panel"><div class="group-detail-header"><div><span class="eyebrow">COMMUNITY</span><h2>${escapeHTML(group.name)}</h2><p>${escapeHTML(group.description || "")}</p></div><button class="plain-icon" data-action="close-group">${icon("close")}</button></div>
    ${canManage ? `<section class="group-admin-panel"><div class="section-heading"><h3>Group admin</h3></div><p>Review requests to join this private community.</p>${requests.length ? requests.map((request) => `<div class="group-request-row">${avatar(request.user_id, "avatar-small")}<strong>${escapeHTML(person(request.user_id).name)}</strong><button class="primary-button small" data-action="review-group-request" data-group="${escapeHTML(group.id)}" data-user="${escapeHTML(request.user_id)}" data-approve="true">Approve</button><button class="secondary-button small" data-action="review-group-request" data-group="${escapeHTML(group.id)}" data-user="${escapeHTML(request.user_id)}" data-approve="false">Decline</button></div>`).join("") : '<p class="muted-copy">No pending join requests.</p>'}</section>` : ""}
    ${group.joined ? `<button class="composer-input group-composer" data-action="open-group-composer" data-id="${group.id}">Share something with this group…</button>` : '<p class="muted-copy">Join this group to see posts and start a discussion.</p>'}
    ${posts.length ? posts.map(postCard).join("") : '<div class="empty-state"><h3>No group posts yet</h3><p>Start a conversation with your community.</p></div>'}
  </section>`;
}

async function refreshGroupRequests(groupId) {
  const group = state.communities.find((item) => item.id === groupId);
  if (!state.authUser || group?.owner_id !== state.authUser.id) {
    state.groupRequests = [];
    return;
  }
  const requests = await fetchGroupRequests(groupId);
  for (const request of requests) {
    if (request.profile) state.profiles[request.user_id] = await hydrateProfile(request.profile);
  }
  state.groupRequests = requests;
}

function pagesView() {
  return `<section class="page-content">${pageHeading("Pages", "Discover organizations, creators, and communities.")}<div class="groups-banner panel"><div><span class="eyebrow">CREATE A PRESENCE</span><h2>Make a page for what you love.</h2><p>Build a community around a cause, a project, or your next big idea.</p></div><button class="primary-button" data-action="create-page">${icon("plus", 17)} Create page</button></div>
    <div class="section-heading"><h2>Pages</h2><span class="muted-count">${state.pages.length}</span></div><div class="pages-grid">${state.pages.map((page) => `<article class="page-card panel"><div class="page-mark">${escapeHTML(page.name[0]?.toUpperCase() || "P")}</div><div class="page-card-body"><h2>${escapeHTML(page.name)}</h2><p>${escapeHTML(page.description || "A new page in your community.")}</p><small>${page.followers || 0} followers</small><div class="page-actions"><button class="secondary-button" data-action="open-page" data-id="${page.id}">View page</button>${backendConfigured && page.owner_id !== state.authUser?.id ? `<button class="primary-button" data-action="toggle-page-follow" data-id="${page.id}">${page.followed ? "Following" : "Follow"}</button>` : ""}</div></div></article>`).join("")}</div>
    ${state.activePage ? pageDetailView() : ""}
  </section>`;
}

function pageDetailView() {
  const page = state.pages.find((item) => item.id === state.activePage);
  if (!page) return "";
  const posts = state.pagePosts.filter((post) => post.pageId === page.id);
  const analytics = state.pageAnalytics[page.id];
  const isOwner = page.owner_id === state.authUser?.id;
  return `<section class="group-detail panel"><div class="group-detail-header"><div><span class="eyebrow">PAGE</span><h2>${escapeHTML(page.name)}</h2><p>${escapeHTML(page.description)}</p><small>${page.followers} followers</small></div><button class="plain-icon" data-action="close-page">${icon("close")}</button></div>
    ${isOwner ? `<section class="page-analytics" aria-label="Page analytics"><div><span>Followers</span><strong>${page.followers}</strong></div><div><span>Posts</span><strong>${analytics?.posts ?? "—"}</strong></div><div><span>Reactions</span><strong>${analytics?.reactions ?? "—"}</strong></div><div><span>Comments</span><strong>${analytics?.comments ?? "—"}</strong></div></section><button class="composer-input group-composer" data-action="open-page-composer" data-id="${page.id}">Write a post as ${escapeHTML(page.name)}…</button>` : ""}
    ${posts.length ? posts.map(postCard).join("") : '<div class="empty-state"><h3>No posts yet</h3></div>'}
  </section>`;
}

function profileView() {
  const user = person(ui.profileId);
  const own = ui.profileId === "you";
  const posts = state.posts.filter((post) => post.author === ui.profileId);
  const friends = state.friends.map((id) => person(id));
  const profileContent = ui.profileTab === "About"
    ? `<div class="profile-feed"><div class="profile-intro panel"><h2>Intro</h2><p>${escapeHTML(user.bio || "Welcome to my profile!")}</p>${own ? '<button class="secondary-button" data-action="edit-profile">Edit details</button>' : ""}</div><section class="panel profile-about"><h2>About ${own ? "you" : escapeHTML(user.name)}</h2><div class="intro-line">${icon("friends", 17)} <span><strong>${own ? state.friends.length : (user.mutuals || 4)} friends</strong></span></div><div class="intro-line">${icon("globe", 17)} <span>Joined Facebook recently</span></div><div class="intro-line">${icon("pin", 17)} <span>${escapeHTML(user.note || "New York, New York")}</span></div></section></div>`
    : ui.profileTab === "Friends"
      ? `<section class="profile-friends">${friends.length ? `<div class="people-grid">${friends.map((friend) => friendCard(friend, "friend")).join("")}</div>` : '<div class="panel empty-state"><h2>No friends to show</h2></div>'}</section>`
      : ui.profileTab === "Photos"
        ? `<section class="profile-photos panel">${posts.filter((post) => post.image).length ? `<div class="photo-grid">${posts.filter((post) => post.image).map((post) => `<button data-action="view-photo" data-id="${escapeHTML(post.id)}" aria-label="View photo"><img src="${imageURL(post.image)}" alt="${escapeHTML(post.text || "Shared photo")}" loading="lazy"></button>`).join("")}</div>` : '<div class="empty-state"><h2>No photos yet</h2><p>Photos shared in posts will appear here.</p></div>'}</section>`
        : `<div class="profile-feed"><div class="profile-intro panel"><h2>Intro</h2><p>${escapeHTML(user.bio || "Welcome to my profile!")}</p><button class="secondary-button" data-action="edit-profile">${own ? "Edit details" : `See more about ${escapeHTML(user.name)}`}</button><div class="intro-line">${icon("friends", 17)} <span><strong>${own ? state.friends.length : (user.mutuals || 4)} friends</strong></span></div><div class="intro-line">${icon("globe", 17)} <span>Joined Facebook recently</span></div></div><div class="profile-posts">${own ? composer() : ""}<div class="section-heading"><h2>Posts</h2><button class="feed-filter">${icon("menu", 16)} Filters</button></div>${posts.length ? posts.map(postCard).join("") : '<div class="panel empty-state"><h2>No posts yet</h2><p>When they share something, it will show up here.</p></div>'}</div></div>`;
  return `<section class="profile-page"><div class="profile-card panel"><div class="profile-cover" style="--cover-image:url('${imageURL(user.cover || currentUser.cover)}')">${own ? '<button class="cover-edit secondary-button" data-action="edit-profile">Edit cover photo</button>' : ""}</div>
      <div class="profile-details">${avatar(ui.profileId, "profile-avatar")}<div class="profile-copy"><h1>${escapeHTML(user.name)}</h1><p>${escapeHTML(user.bio || "New here. Say hello!")}</p><small>${own ? state.friends.length : (user.mutuals || state.friends.length)} friends · ${state.following.length} following</small></div><div class="profile-buttons">${own ? `<button class="primary-button" data-action="open-composer">${icon("plus", 17)} Add to story</button><button class="secondary-button" data-action="edit-profile">${icon("edit", 17)} Edit profile</button>` : `${state.friends.includes(user.id) ? `<button class="secondary-button" data-action="open-chat" data-id="${user.id}">${icon("message", 17)} Message</button>` : `<button class="${state.outgoing.includes(user.id) ? "secondary-button" : "primary-button"}" data-action="${state.outgoing.includes(user.id) ? "cancel-request" : "add-friend"}" data-id="${user.id}">${state.outgoing.includes(user.id) ? "Request sent" : `${icon("plus", 17)} Add friend`}</button>`}${backendConfigured ? `<button class="secondary-button" data-action="toggle-follow" data-id="${user.id}">${state.following.includes(user.id) ? "Following" : "Follow"}</button><button class="secondary-button" data-action="toggle-block" data-id="${user.id}">${state.blocked.includes(user.id) ? "Unblock" : "Block"}</button>` : ""}`}</div></div>
      <div class="profile-tabs">${["Posts", "About", "Friends", "Photos"].map((tab) => `<button class="${ui.profileTab === tab ? "active" : ""}" data-action="profile-tab" data-tab="${tab}">${tab}</button>`).join("")}</div>
    </div>${profileContent}
  </section>`;
}

function savedView() {
  const savedPosts = state.posts.filter((post) => state.saved.includes(post.id));
  return `<section class="page-content">${pageHeading("Saved", "Posts and moments you saved for later.")}${savedPosts.length ? savedPosts.map(postCard).join("") : '<section class="panel empty-state"><div class="empty-icon">${icon("bookmark", 25)}</div><h2>Nothing saved yet</h2><p>Save posts to find them here later.</p><button class="primary-button" data-action="navigate" data-view="home">Explore your feed</button></section>'}</section>`;
}

function mainView() {
  switch (ui.view) {
    case "friends": return friendsView();
    case "watch": return watchView();
    case "marketplace": return marketplaceView();
    case "groups": return groupsView();
    case "pages": return pagesView();
    case "profile": return profileView();
    case "saved": return savedView();
    case "search": return searchView();
    default: return homeView();
  }
}

function chatPanel() {
  const chats = state.chats;
  const selected = chats.find((chat) => chat.id === ui.chatId);
  if (ui.chatId === null) return "";
  if (!selected) return `<section class="chat-panel panel"><div class="chat-header"><h2>New message</h2><button class="plain-icon" data-action="close-chat">${icon("close")}</button></div><div class="chat-people">${state.friends.map((id) => `<button class="contact-row" data-action="open-chat" data-id="${id}">${avatar(id, "avatar-small")}<strong>${escapeHTML(person(id).name)}</strong></button>`).join("")}</div></section>`;
  const peerId = selected.peerId || selected.id;
  const selfId = state.authUser?.id || "you";
  const peerLastReadAt = selected.peerLastReadAt ? Date.parse(selected.peerLastReadAt) : 0;
  const presenceText = ui.chatTyping ? "Typing…" : ui.chatOnline ? "Online" : "Offline";
  return `<section class="chat-panel panel"><div class="chat-header">${avatar(peerId, "avatar-small")}<div><strong>${escapeHTML(person(peerId).name)}</strong><small><span class="online-dot ${ui.chatOnline ? "" : "offline"}"></span>${presenceText}</small></div><button class="plain-icon" data-action="close-chat" aria-label="Close chat">${icon("close")}</button></div>
    <div class="chat-messages">${selected.messages.map((message) => {
      const outgoing = message.from === selfId;
      const seen = outgoing && message.createdAt && peerLastReadAt >= Date.parse(message.createdAt);
      const attachment = message.attachmentURL
        ? message.attachmentType?.startsWith("image/")
          ? `<a href="${imageURL(message.attachmentURL)}" target="_blank" rel="noopener noreferrer"><img class="message-attachment-image" src="${imageURL(message.attachmentURL)}" alt="${escapeHTML(message.attachmentName || "Message attachment")}"></a>`
          : message.attachmentType?.startsWith("video/")
            ? `<video class="message-attachment-video" src="${imageURL(message.attachmentURL)}" controls preload="metadata"></video>`
            : message.attachmentType?.startsWith("audio/")
              ? `<audio class="message-attachment-audio" src="${imageURL(message.attachmentURL)}" controls preload="metadata"></audio>`
            : `<a class="message-attachment-file" href="${imageURL(message.attachmentURL)}" target="_blank" rel="noopener noreferrer" download="${escapeHTML(message.attachmentName || "download")}">${icon("paperclip", 16)} ${escapeHTML(message.attachmentName || "Download attachment")}</a>`
        : "";
      return `<div class="message-line ${outgoing ? "outgoing" : ""}">${outgoing ? "" : avatar(peerId, "avatar-xs")}<div>${message.text ? `<p>${escapeHTML(message.text)}</p>` : ""}${attachment}<small>${escapeHTML(message.time)}${seen ? " · Seen" : ""}</small></div></div>`;
    }).join("")}</div>
    ${ui.chatTyping ? `<div class="chat-typing" aria-live="polite">${escapeHTML(person(peerId).name)} is typing…</div>` : ""}
    <form class="chat-compose" data-chat="${selected.id}"><label class="chat-attach" title="Attach an image or file" aria-label="Attach an image or file">${icon("paperclip", 18)}<input name="attachment" type="file" accept="${[...messageAttachmentTypes].join(",")}"></label>${selected.remote ? `<button class="chat-voice" type="button" data-action="voice-record" aria-label="Record a voice message" title="Record a voice message">${icon("microphone", 18)}</button>` : ""}<span class="chat-attachment-name" aria-live="polite"></span><input name="message" placeholder="Aa" maxlength="1000" aria-label="Message"><button type="submit" aria-label="Send message">${icon("send", 18)}</button></form>
  </section>`;
}

function modalView() {
  if (!ui.modal) return "";
  const modal = ui.modal;
  if (modal.type === "composer" || modal.type === "edit-post") {
    const editing = modal.type === "edit-post";
    const existing = editing ? state.posts.find((post) => post.id === modal.id) : null;
    const group = modal.groupId ? state.communities.find((item) => item.id === modal.groupId) : null;
    const page = modal.pageId ? state.pages.find((item) => item.id === modal.pageId) : null;
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal panel" data-modal-content><div class="modal-header"><h2>${editing ? "Edit post" : group ? `Post in ${escapeHTML(group.name)}` : page ? `Post as ${escapeHTML(page.name)}` : "Create post"}</h2><button class="plain-icon" data-action="close-modal" aria-label="Close">${icon("close")}</button></div><form id="post-form" data-edit="${editing ? escapeHTML(modal.id) : ""}" data-group="${escapeHTML(modal.groupId || "")}" data-page="${escapeHTML(modal.pageId || "")}"><div class="modal-user">${avatar("you")}<div><strong>${escapeHTML(state.profile.name)}</strong><small>${icon("globe", 13)} ${group ? "Group members" : page ? "Page followers" : "Friends"}</small></div></div><textarea name="post" placeholder="What's on your mind, ${escapeHTML(state.profile.name.split(" ")[0])}?" maxlength="10000" rows="5">${escapeHTML(existing?.text || "")}</textarea><div id="image-preview" class="image-preview"></div>${editing ? "" : `<div class="add-to-post"><strong>Add to your post</strong><label class="photo-upload" title="Add photos">${icon("photo", 21)}<input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/gif" multiple aria-label="Choose photos"></label><button type="button" class="photo-upload" data-action="add-feeling">${icon("smile", 21)}</button><button type="button" class="photo-upload" data-action="toggle-poll" aria-expanded="false">Poll</button></div><section class="poll-composer" data-poll-fields hidden><strong>Poll options</strong><input name="poll-option" maxlength="120" placeholder="Option 1"><input name="poll-option" maxlength="120" placeholder="Option 2"><input name="poll-option" maxlength="120" placeholder="Option 3 (optional)"><input name="poll-option" maxlength="120" placeholder="Option 4 (optional)"></section><small class="upload-hint">Up to 5 photos, compressed before upload. Polls need a question and at least 2 options.</small>`}<button type="submit" class="primary-button post-submit">${editing ? "Save changes" : "Post"}</button></form></section></div>`;
  }
  if (modal.type === "profile") return `<div class="modal-backdrop" data-action="close-modal"><section class="modal panel" data-modal-content><div class="modal-header"><h2>Edit profile</h2><button class="plain-icon" data-action="close-modal" aria-label="Close">${icon("close")}</button></div><form id="profile-form" class="profile-form"><label>Display name<input name="name" value="${escapeHTML(state.profile.name)}" maxlength="80" required></label><label>Bio<textarea name="bio" maxlength="500" rows="3">${escapeHTML(state.profile.bio)}</textarea></label><label>Profile picture URL<input name="avatar" value="${escapeHTML(state.profile.avatar)}" type="url"></label><label>Upload a profile picture<input name="avatar_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><label>Cover photo URL<input name="cover" value="${escapeHTML(state.profile.cover || "")}" type="url"></label><label>Upload a cover photo<input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label><label>Education<input name="education" value="${escapeHTML(state.profile.education || "")}" maxlength="200"></label><label>Work experience<input name="work" value="${escapeHTML(state.profile.work || "")}" maxlength="200"></label><label>Location<input name="location" value="${escapeHTML(state.profile.location || "")}" maxlength="200"></label><label>Website<input name="website" value="${escapeHTML(state.profile.website || "")}" type="url" maxlength="2048"></label><label>Profile privacy<select name="privacy"><option value="public" ${state.profile.privacy === "public" ? "selected" : ""}>Public</option><option value="friends" ${state.profile.privacy === "friends" ? "selected" : ""}>Friends only</option><option value="private" ${state.profile.privacy === "private" ? "selected" : ""}>Private</option></select></label><button type="submit" class="primary-button">Save changes</button></form></section></div>`;
  if (modal.type === "create-story") return `<div class="modal-backdrop" data-action="close-modal"><section class="modal panel" data-modal-content><div class="modal-header"><h2>Create a story</h2><button class="plain-icon" data-action="close-modal" aria-label="Close">${icon("close")}</button></div><form id="story-form"><label class="story-upload-area">${icon("photo", 30)}<strong>Choose a photo or video</strong><small>Stories disappear after 24 hours · max 10 MB</small><input type="file" name="story_media" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" required></label><div id="story-preview"></div><label class="story-caption-input">Caption<input name="caption" maxlength="500" placeholder="Add a caption"></label><button class="primary-button post-submit" type="submit">Share story</button></form></section></div>`;
  if (modal.type === "story") return `<div class="modal-backdrop story-backdrop" data-action="close-modal"><section class="story-modal" data-modal-content style="--story-image:url('${imageURL(modal.image)}')"><button class="plain-icon story-close" data-action="close-modal" aria-label="Close">${icon("close")}</button><div class="story-owner">${avatar(modal.author || modal.id, "avatar-small")}<strong>${escapeHTML(modal.name || person(modal.author || modal.id).name)}</strong><small>${modal.expiresAt ? `${Math.max(1, Math.ceil((new Date(modal.expiresAt).getTime() - Date.now()) / 3600000))}h left` : "Today"}</small></div>${modal.kind === "video" ? `<video class="story-video" src="${imageURL(modal.image)}" autoplay controls playsinline></video>` : ""}<div class="story-caption">${escapeHTML(modal.caption || `${modal.name || person(modal.author || modal.id).name}'s story`)}</div>${modal.author === state.authUser?.id ? `<span class="story-view-count">${modal.views || 0} views</span>` : ""}</section></div>`;
  if (modal.type === "video") return `<div class="modal-backdrop" data-action="close-modal"><section class="video-modal panel" data-modal-content><button class="plain-icon" data-action="close-modal" aria-label="Close">${icon("close")}</button><div class="video-placeholder">${icon("play", 54)}</div><h2>${escapeHTML(modal.title)}</h2><p>This is a demo video preview.</p></section></div>`;
  if (modal.type === "photo") return `<div class="modal-backdrop" data-action="close-modal"><section class="photo-modal panel" data-modal-content><button class="plain-icon" data-action="close-modal" aria-label="Close">${icon("close")}</button><img src="${imageURL(modal.image)}" alt="${escapeHTML(modal.text || "Shared photo")}"><p>${escapeHTML(modal.text)}</p></section></div>`;
  if (modal.type === "product") {
    const product = products.find((item) => item.id === modal.id);
    return `<div class="modal-backdrop" data-action="close-modal"><section class="product-modal panel" data-modal-content><button class="plain-icon" data-action="close-modal" aria-label="Close">${icon("close")}</button><img src="${imageURL(product.image)}" alt="${escapeHTML(product.title)}"><div><h2>${escapeHTML(product.title)}</h2><strong>${escapeHTML(product.price)}</strong><p>${escapeHTML(product.location)} · Listed recently by ${escapeHTML(person(product.seller).name)}</p><p>Message the seller to ask questions or arrange a pickup.</p><button class="primary-button" data-action="contact-seller" data-id="${product.id}">${icon("message", 17)} Message seller</button></div></section></div>`;
  }
  if (modal.type === "info") return `<div class="modal-backdrop" data-action="close-modal"><section class="modal panel info-modal" data-modal-content><div class="modal-header"><h2>${escapeHTML(modal.title)}</h2><button class="plain-icon" data-action="close-modal">${icon("close")}</button></div><p>${escapeHTML(modal.text)}</p><button class="primary-button" data-action="close-modal">Got it</button></section></div>`;
  if (modal.type === "create-group" || modal.type === "create-page") {
    const isGroup = modal.type === "create-group";
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal panel" data-modal-content><div class="modal-header"><h2>${isGroup ? "Create a group" : "Create a page"}</h2><button class="plain-icon" data-action="close-modal">${icon("close")}</button></div><form id="${isGroup ? "group-form" : "page-form"}" class="profile-form"><label>${isGroup ? "Group" : "Page"} name<input name="name" maxlength="100" required></label><label>Description<textarea name="description" rows="4" maxlength="2000"></textarea></label>${isGroup ? '<label>Privacy<select name="privacy"><option value="public">Public — anyone can join</option><option value="private">Private — invitation only</option></select></label>' : ""}<button class="primary-button" type="submit">Create ${isGroup ? "group" : "page"}</button></form></section></div>`;
  }
  if (modal.type === "report") return `<div class="modal-backdrop" data-action="close-modal"><section class="modal panel" data-modal-content><div class="modal-header"><h2>Report this post</h2><button class="plain-icon" data-action="close-modal">${icon("close")}</button></div><p>Tell us why this post should be reviewed.</p><form id="report-form" data-post="${escapeHTML(modal.id)}" class="profile-form"><label>Reason<textarea name="reason" minlength="3" maxlength="1000" required placeholder="Describe the issue"></textarea></label><button class="primary-button" type="submit">Submit report</button></form></section></div>`;
  return "";
}

function render() {
  document.body.classList.toggle("dark-mode", state.dark);
  if ((backendConfigured && !state.authUser) || ui.authMode === "update-password") {
    app.innerHTML = `${authView()}<div class="toast-region" aria-live="polite"></div>`;
    return;
  }
  app.innerHTML = `${header()}<div class="layout">${sidebar()}<main class="main-content">${mainView()}</main>${ui.view === "home" || ui.view === "search" ? rightSidebar() : ""}</div>${chatPanel()}${modalView()}<div class="toast-region" aria-live="polite"></div>`;
  setupFeedObserver();
}

let feedObserver;
function setupFeedObserver() {
  feedObserver?.disconnect();
  if (!backendConfigured || !state.authUser || ui.view !== "home" || !state.hasMorePosts || !("IntersectionObserver" in window)) return;
  const sentinel = document.querySelector(".feed-sentinel");
  if (!sentinel) return;
  feedObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting) && !state.feedLoading && state.hasMorePosts) {
      loadRemoteFeed({ append: true }).catch((error) => reportBackendError(error, "Could not load more posts."));
    }
  }, { rootMargin: "500px" });
  feedObserver.observe(sentinel);
}

let toastTimer;
function toast(message) {
  const region = document.querySelector(".toast-region");
  if (!region) return;
  region.innerHTML = `<div class="toast-message">${escapeHTML(message)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { region.innerHTML = ""; }, 2600);
}

function navigate(view) {
  ui.view = view;
  ui.search = "";
  ui.noticeOpen = false;
  ui.menuPost = null;
  document.querySelector(".left-sidebar")?.classList.remove("mobile-open");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addNotification(text, personId = "you") {
  state.notifications.unshift({ id: `n-${Date.now()}`, text, time: "Just now", read: false, person: personId });
}

function reportBackendError(error, fallback) {
  const message = error instanceof Error ? error.message : fallback;
  console.error(fallback, error);
  state.authBusy = false;
  if (backendConfigured && !state.authUser) {
    ui.authMessage = message;
    ui.authError = true;
    render();
  } else {
    toast(message || fallback);
  }
}

async function hydrateProfile(databaseProfile) {
  const profile = profileFromDatabase(databaseProfile);
  if (profile.avatarPath) {
    profile.avatar = await signedMediaURL(profile.avatarPath);
  }
  if (profile.coverPath) {
    profile.cover = await signedMediaURL(profile.coverPath);
  }
  return profile;
}

async function loadRemoteFeed({ append = false } = {}) {
  if (!state.authUser) return;
  if (state.feedLoading) return;
  state.feedLoading = true;
  try {
    const offset = append ? state.feedOffset : 0;
    const remotePosts = await fetchFeed(state.authUser.id, { offset, limit: 20 });
    if (!append) state.feedOffset = 0;
    state.feedOffset += remotePosts.length;
    state.hasMorePosts = remotePosts.length === 20;
    const profiles = { ...state.profiles };
    for (const post of remotePosts) {
      if (post.profile) profiles[post.author] = await hydrateProfile(post.profile);
      for (const comment of post.comments) {
        if (comment.profile) profiles[comment.author] = await hydrateProfile(comment.profile);
      }
    }
    state.profiles = profiles;
    const existingRemote = append ? state.posts.filter((post) => post.remote) : [];
    const demoPosts = append || ui.search ? state.posts.filter((post) => !post.remote) : initialPosts.map((post) => ({ ...post, comments: [...post.comments] }));
    state.posts = [...existingRemote, ...remotePosts, ...demoPosts];
    state.remoteReady = true;
    render();
  } finally {
    state.feedLoading = false;
  }
}

async function loadRemoteConnections() {
  if (!state.authUser) return;
  const [connections, following, blocked] = await Promise.all([
    fetchConnections(state.authUser.id),
    fetchFollowing(state.authUser.id),
    fetchBlockedUsers(state.authUser.id),
  ]);
  const profiles = { ...state.profiles };
  for (const request of connections.requests) {
    if (request.requester) profiles[request.requester.id] = await hydrateProfile(request.requester);
    if (request.addressee) profiles[request.addressee.id] = await hydrateProfile(request.addressee);
  }
  const hydratedSuggestions = await Promise.all(connections.suggestions.map(hydrateProfile));
  hydratedSuggestions.forEach((profile) => { profiles[profile.id] = profile; });
  state.profiles = profiles;
  state.friendRequests = connections.requests;
  state.friends = connections.friends;
  state.incoming = connections.incoming;
  state.outgoing = connections.outgoing;
  state.suggestions = hydratedSuggestions;
  state.following = following.map((row) => row.followed_id);
  state.blocked = blocked.map((row) => row.blocked_id);
  render();
}

async function loadRemoteConversations() {
  if (!state.authUser) return;
  const conversations = await fetchConversations();
  const profiles = { ...state.profiles };
  state.chats = await Promise.all(conversations.map(async (conversation) => {
    const peer = conversation.members.find((member) => member.user_id !== state.authUser.id);
    const self = conversation.members.find((member) => member.user_id === state.authUser.id);
    if (peer?.profiles) profiles[peer.user_id] = await hydrateProfile(peer.profiles);
    const lastReadAt = self?.last_read_at || null;
    return {
      id: conversation.id,
      peerId: peer?.user_id,
      remote: true,
      lastReadAt,
      peerLastReadAt: peer?.last_read_at || null,
      unread: conversation.messages.filter((message) => message.sender_id !== state.authUser.id
        && (!lastReadAt || Date.parse(message.created_at) > Date.parse(lastReadAt))).length,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        from: message.sender_id,
        text: message.body,
        attachmentURL: message.attachment_url,
        attachmentName: message.attachment_name,
        attachmentType: message.attachment_type,
        createdAt: message.created_at,
        time: new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      })),
    };
  }));
  state.profiles = profiles;
  const activeChat = state.chats.find((chat) => chat.id === ui.chatId && chat.remote);
  const hasUnreadMessages = activeChat?.messages.some((message) => message.from !== state.authUser.id
    && (!activeChat.lastReadAt || Date.parse(message.createdAt) > Date.parse(activeChat.lastReadAt)));
  if (activeChat && hasUnreadMessages) {
    markChatAsRead(activeChat, false).catch((error) => reportBackendError(error, "Could not mark messages as read."));
  }
  render();
}

async function markChatAsRead(chat, shouldRender = true) {
  if (!state.authUser || !chat?.remote) return;
  const lastReadAt = new Date().toISOString();
  await markConversationRead(chat.id, state.authUser.id);
  chat.lastReadAt = lastReadAt;
  chat.unread = 0;
  if (shouldRender) render();
}

let activeConversationChannelId = null;
let activeConversationSubscription = null;
let typingBroadcastTimer = null;
let remoteTypingTimer = null;
let lastTypingBroadcastAt = 0;
let activeVoiceRecorder = null;
let voiceRecorderStarting = false;
let voiceRecordingLimitTimer = null;
let voiceRecorderStream = null;
let voiceRecordingChatId = null;
let voiceRecordingParts = [];

function disconnectConversationRealtime() {
  if (activeConversationSubscription) activeConversationSubscription.unsubscribe();
  activeConversationSubscription = null;
  activeConversationChannelId = null;
  clearTimeout(typingBroadcastTimer);
  clearTimeout(remoteTypingTimer);
  clearTimeout(voiceRecordingLimitTimer);
  if (activeVoiceRecorder?.state === "recording") activeVoiceRecorder.stop();
  voiceRecorderStream?.getTracks().forEach((track) => track.stop());
  voiceRecorderStream = null;
  ui.chatTyping = false;
  ui.chatOnline = false;
}

function connectConversationRealtime(chat) {
  if (!state.authUser || !chat?.remote) return;
  if (activeConversationChannelId === chat.id && activeConversationSubscription) return;
  disconnectConversationRealtime();
  activeConversationChannelId = chat.id;
  activeConversationSubscription = subscribeToConversation({
    conversationId: chat.id,
    userId: state.authUser.id,
    onPresence: (userIds) => {
      if (ui.chatId !== chat.id) return;
      ui.chatOnline = userIds.includes(chat.peerId);
      render();
    },
    onTyping: (typing) => {
      if (ui.chatId !== chat.id) return;
      clearTimeout(remoteTypingTimer);
      ui.chatTyping = typing;
      if (typing) {
        remoteTypingTimer = setTimeout(() => {
          ui.chatTyping = false;
          if (ui.chatId === chat.id) render();
        }, 2500);
      }
      render();
    },
    onStatus: (status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        reportBackendError(new Error(`Realtime channel status: ${status}`), "Live chat status is unavailable.");
      }
    },
  });
}

function broadcastTyping(typing) {
  if (!activeConversationSubscription || !state.authUser) return;
  activeConversationSubscription.sendTyping(typing)
    .catch((error) => reportBackendError(error, "Could not update typing status."));
}

app.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.name !== "message" || !input.closest(".chat-compose")) return;
  if (!activeConversationSubscription || !state.authUser) return;
  const typing = Boolean(input.value.trim());
  const now = Date.now();
  if (!typing || now - lastTypingBroadcastAt > 1000) {
    broadcastTyping(typing);
    lastTypingBroadcastAt = now;
  }
  clearTimeout(typingBroadcastTimer);
  if (typing) typingBroadcastTimer = setTimeout(() => broadcastTyping(false), 1800);
});

async function toggleVoiceRecording(button) {
  const targetChatId = ui.chatId;
  if (activeVoiceRecorder?.state === "recording") {
    button.disabled = true;
    button.textContent = "Saving…";
    activeVoiceRecorder.stop();
    return;
  }
  if (voiceRecorderStarting) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    toast("Voice recording is not supported by this browser.");
    return;
  }

  let stream;
  voiceRecorderStarting = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (ui.chatId !== targetChatId || !button.isConnected) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    const mimeType = typeof MediaRecorder.isTypeSupported === "function"
      ? ["audio/webm", "audio/ogg", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type))
      : undefined;
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    voiceRecorderStream = stream;
    activeVoiceRecorder = recorder;
    voiceRecordingChatId = targetChatId;
    voiceRecordingParts = [];
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) voiceRecordingParts.push(event.data);
      if (voiceRecordingParts.reduce((total, part) => total + part.size, 0) > 10 * 1024 * 1024
        && recorder.state === "recording") recorder.stop();
    });
    recorder.addEventListener("stop", () => {
      clearTimeout(voiceRecordingLimitTimer);
      stream.getTracks().forEach((track) => track.stop());
      voiceRecorderStream = null;
      activeVoiceRecorder = null;
      const currentButton = document.querySelector('[data-action="voice-record"]');
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.innerHTML = icon("microphone", 18);
        currentButton.classList.remove("recording");
        currentButton.setAttribute("aria-label", "Record a voice message");
        currentButton.title = "Record a voice message";
      }
      if (voiceRecordingChatId !== ui.chatId) {
        toast("Recording stopped because the conversation changed.");
        voiceRecordingParts = [];
        return;
      }
      const audioType = (recorder.mimeType || "audio/webm").split(";")[0];
      const blob = new Blob(voiceRecordingParts, { type: audioType });
      voiceRecordingParts = [];
      if (!blob.size) { toast("No audio was recorded."); return; }
      if (blob.size > 10 * 1024 * 1024) { toast("Voice notes must be smaller than 10 MB."); return; }
      const extension = (blob.type.split("/")[1] || "webm").split(";")[0];
      const file = new File([blob], `voice-note.${extension}`, { type: blob.type });
      const input = document.querySelector('.chat-compose [name="attachment"]');
      if (!input) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      toast("Voice note ready to send.");
    });
    recorder.start();
    voiceRecordingLimitTimer = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 120_000);
    button.textContent = "Stop";
    button.setAttribute("aria-label", "Stop recording");
    button.title = "Stop recording";
    button.classList.add("recording");
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    voiceRecorderStream = null;
    activeVoiceRecorder = null;
    reportBackendError(error, "Could not access the microphone.");
  } finally {
    voiceRecorderStarting = false;
  }
}

async function loadRemoteNotifications() {
  if (!state.authUser) return;
  const rows = await fetchNotifications(state.authUser.id);
  const profiles = { ...state.profiles };
  const notifications = [];
  for (const row of rows) {
    if (row.actor) profiles[row.actor_id] = await hydrateProfile(row.actor);
    const actorName = row.actor?.full_name || "Someone";
    const text = {
      reaction: `${actorName} reacted to your post.`,
      comment: `${actorName} commented on your post.`,
      friend_request: `${actorName} sent you a friend request.`,
      friend_accepted: `${actorName} accepted your friend request.`,
      follow: `${actorName} started following you.`,
      message: `${actorName} sent you a message.`,
    }[row.kind] || "You have a new notification.";
    notifications.push({
      id: row.id,
      actorId: row.actor_id,
      postId: row.post_id,
      text,
      time: new Date(row.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      read: Boolean(row.read_at),
      person: row.actor_id,
    });
  }
  state.notifications = notifications;
  state.profiles = profiles;
  render();
}

async function loadRemoteCommunity() {
  if (!state.authUser) return;
  const [communities, pages, activeStories, savedPosts, trending] = await Promise.all([
    fetchGroups(state.authUser.id),
    fetchPages(state.authUser.id),
    fetchStories(),
    fetchSavedPosts(state.authUser.id),
    fetchTrendingHashtags(),
  ]);
  state.communities = communities;
  state.pages = pages;
  state.storyItems = activeStories;
  state.saved = savedPosts.map((item) => item.post_id);
  state.trendingHashtags = trending;
  render();
}

let removeFeedSubscription;
let removeMessageSubscription;
let removeNotificationSubscription;
let loadedAuthUserId;
async function applyAuthSession(session) {
  if (!session?.user) {
    disconnectConversationRealtime();
    if (removeFeedSubscription) removeFeedSubscription();
    if (removeMessageSubscription) removeMessageSubscription();
    if (removeNotificationSubscription) removeNotificationSubscription();
    removeFeedSubscription = null;
    removeMessageSubscription = null;
    removeNotificationSubscription = null;
    loadedAuthUserId = null;
    state.authUser = null;
    state.profile = { ...currentUser };
    state.profiles = {};
    state.remoteReady = false;
    state.pageAnalytics = {};
    state.groupRequests = [];
    state.friendRequests = [];
    state.friends = ["maya", "jordan", "sofia"];
    state.incoming = ["sam", "olivia"];
    state.outgoing = [];
    state.suggestions = people;
    state.following = [];
    state.blocked = [];
    state.chats = initialChats.map((chat) => ({ ...chat, messages: [...chat.messages] }));
    state.groupRequests = [];
    state.posts = initialPosts.map((post) => ({ ...post, comments: [...post.comments] }));
    render();
    return;
  }
  if (loadedAuthUserId === session.user.id && state.remoteReady) return;
  if (loadedAuthUserId && loadedAuthUserId !== session.user.id) {
    disconnectConversationRealtime();
    state.profiles = {};
    state.friends = [];
    state.incoming = [];
    state.outgoing = [];
    state.friendRequests = [];
    state.suggestions = [];
    state.following = [];
    state.blocked = [];
    state.chats = [];
    state.pageAnalytics = {};
    state.groupRequests = [];
    state.notifications = [];
    state.posts = initialPosts.map((post) => ({ ...post, comments: [...post.comments] }));
  }
  loadedAuthUserId = session.user.id;
  state.authUser = session.user;
  state.remoteReady = false;
  render();
  try {
    const [remoteProfile] = await Promise.all([
      getProfile(session.user.id),
      loadRemoteFeed(),
      loadRemoteConnections(),
      loadRemoteConversations(),
      loadRemoteNotifications(),
      loadRemoteCommunity(),
    ]);
    if (remoteProfile) {
      state.profile = await hydrateProfile(remoteProfile);
      state.profiles[session.user.id] = state.profile;
    } else {
      const metadata = session.user.user_metadata || {};
      state.profile = {
        ...currentUser,
        id: session.user.id,
        name: metadata.full_name || session.user.email?.split("@")[0] || "New member",
      };
    }
    if (removeFeedSubscription) removeFeedSubscription();
    if (removeMessageSubscription) removeMessageSubscription();
    if (removeNotificationSubscription) removeNotificationSubscription();
    removeFeedSubscription = subscribeToFeed(() => {
      loadRemoteFeed().catch((error) => reportBackendError(error, "Could not refresh the community feed."));
    });
    removeMessageSubscription = subscribeToMessages(() => {
      loadRemoteConversations().catch((error) => reportBackendError(error, "Could not refresh your messages."));
    });
    removeNotificationSubscription = subscribeToNotifications(() => {
      loadRemoteNotifications().catch((error) => reportBackendError(error, "Could not refresh your notifications."));
    });
    ui.authMessage = "";
    ui.authError = false;
    render();
  } catch (error) {
    reportBackendError(error, "Could not load your account data.");
  }
}

async function initializeBackend() {
  if (!backendConfigured) {
    render();
    return;
  }
  try {
    const session = await getSession();
    await applyAuthSession(session);
    onAuthChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") { ui.authMode = "update-password"; ui.authMessage = "Choose a new password for your account."; render(); }
      if (event === "SIGNED_OUT") { ui.authMode = "login"; ui.authMessage = ""; }
      queueMicrotask(() => {
        applyAuthSession(nextSession).catch((error) => reportBackendError(error, "Could not update your sign-in session."));
      });
    });
  } catch (error) {
    reportBackendError(error, "Could not connect to Supabase. Check your project URL and public key.");
  }
}

function dataURLFile(dataURL) {
  const [header, encoded] = dataURL.split(",");
  const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return new File([bytes], "post-image.jpg", { type: mimeType });
}

function readDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "close-modal" && event.target.closest("[data-modal-content]")) return;

  if (action === "auth-mode") { ui.authMode = button.dataset.mode; ui.authMessage = ""; ui.authError = false; render(); }
  if (action === "google-login") {
    state.authBusy = true; render();
    signInWithGoogle().catch((error) => reportBackendError(error, "Could not start Google sign-in."));
  }
  if (action === "sign-out") signOut().catch((error) => reportBackendError(error, "Could not sign out."));
  if (action === "voice-record") toggleVoiceRecording(button);
  if (action === "navigate") navigate(button.dataset.view);
  if (action === "navigate-profile") { ui.profileId = button.dataset.id; ui.profileTab = "Posts"; navigate("profile"); }
  if (action === "open-composer") { ui.modal = { type: "composer" }; render(); document.querySelector('[name="post"]')?.focus(); }
  if (action === "toggle-poll") {
    const form = button.closest("#post-form");
    const fields = form?.querySelector("[data-poll-fields]");
    if (form && fields) {
      fields.hidden = !fields.hidden;
      form.dataset.poll = String(!fields.hidden);
      button.setAttribute("aria-expanded", String(!fields.hidden));
      button.textContent = fields.hidden ? "Poll" : "Remove poll";
    }
  }
  if (action === "vote-poll") {
    const post = [...state.posts, ...state.groupPosts, ...state.pagePosts].find((item) => item.id === id);
    const optionId = button.dataset.option;
    if (!post?.poll || !optionId || post.poll.ownOptionId) return;
    if (post.remote && state.authUser) {
      votePostPoll({ postId: id, optionId, userId: state.authUser.id }).then(async () => {
        if (state.posts.some((item) => item.id === id)) await loadRemoteFeed();
        if (post.groupId) {
          const posts = await fetchGroupPosts(post.groupId);
          state.groupPosts = [...state.groupPosts.filter((item) => item.groupId !== post.groupId), ...posts];
        }
        if (post.pageId) {
          const posts = await fetchPagePosts(post.pageId);
          state.pagePosts = [...state.pagePosts.filter((item) => item.pageId !== post.pageId), ...posts];
        }
        render();
      }).catch((error) => reportBackendError(error, "Could not record your poll vote."));
    } else {
      const option = post.poll.options.find((item) => item.id === optionId);
      if (!option) return;
      option.votes += 1;
      post.poll.ownOptionId = optionId;
      save();
      render();
    }
  }
  if (action === "create-story") { ui.modal = { type: "create-story" }; render(); }
  if (action === "create-group") { ui.modal = { type: "create-group" }; render(); }
  if (action === "create-page") { ui.modal = { type: "create-page" }; render(); }
  if (action === "open-group" && backendConfigured) {
    const searchGroup = state.searchResults?.groups.find((group) => group.id === id);
    if (searchGroup && !state.communities.some((group) => group.id === id)) {
      state.communities.unshift({ ...searchGroup, members: "Community", joined: false, role: null });
    }
    ui.activeGroup = id;
    ui.groupLoading = true;
    render();
    fetchGroupPosts(id).then(async (posts) => {
      state.groupPosts = [...state.groupPosts.filter((post) => post.groupId !== id), ...posts];
      for (const post of posts) { if (post.profile) state.profiles[post.author] = await hydrateProfile(post.profile); }
      await refreshGroupRequests(id);
      ui.groupLoading = false; render();
    }).catch((error) => { ui.groupLoading = false; reportBackendError(error, "Could not load the group."); });
  }
  if (action === "close-group") { ui.activeGroup = null; render(); }
  if (action === "open-group-composer") { ui.modal = { type: "composer", groupId: id }; render(); }
  if (action === "open-page-composer") { ui.modal = { type: "composer", pageId: id }; render(); }
  if (action === "open-page" && backendConfigured) {
    ui.activePage = id;
    fetchPagePosts(id).then(async (posts) => {
      state.pagePosts = [...state.pagePosts.filter((post) => post.pageId !== id), ...posts];
      const page = state.pages.find((item) => item.id === id);
      if (page?.owner_id === state.authUser?.id) state.pageAnalytics[id] = await fetchPageAnalytics(id);
      render();
    })
      .catch((error) => reportBackendError(error, "Could not load page posts."));
  }
  if (action === "close-page") { ui.activePage = null; render(); }
  if (action === "close-modal") { ui.modal = null; render(); }
  if (action === "toggle-theme") { state.dark = !state.dark; save(); render(); }
  if (action === "toggle-notifications") { ui.noticeOpen = !ui.noticeOpen; render(); }
  if (action === "mark-read" && backendConfigured && state.authUser) {
    markNotificationsRead(state.authUser.id).then(loadRemoteNotifications)
      .catch((error) => reportBackendError(error, "Could not mark notifications as read."));
  } else if (action === "mark-read") { state.notifications.forEach((item) => { item.read = true; }); save(); render(); }
  if (action === "open-notification") {
    const item = state.notifications.find((note) => note.id === button.dataset.notification);
    if (item) item.read = true;
    if (backendConfigured && state.authUser && item?.id) {
      markNotificationsRead(state.authUser.id, item.id).catch((error) => reportBackendError(error, "Could not update the notification."));
    } else save();
    ui.noticeOpen = false; ui.profileId = button.dataset.person; navigate("profile");
  }
  if (action === "like-post") {
    const post = state.posts.find((item) => item.id === id);
    if (post && post.remote && state.authUser) {
      const remove = post.liked;
      post.liked = !remove;
      post.reactionKind = remove ? null : "like";
      post.likes = Math.max(0, (post.likes || 0) + (remove ? -1 : 1));
      render();
      setPostReaction({ postId: id, userId: state.authUser.id, remove }).then(loadRemoteFeed)
        .catch((error) => reportBackendError(error, "Could not update your reaction."));
    } else if (post) {
      post.liked = !post.liked;
      post.reactionKind = post.liked ? "like" : null;
      post.likes = Math.max(0, (post.likes || 0) + (post.liked ? 1 : -1));
      save(); render();
    }
  }
  if (action === "search-hashtag") {
    ui.search = `#${button.dataset.tag}`;
    ui.searchKind = "all";
    ui.view = "search";
    state.searchResults = null;
    render();
    if (backendConfigured && state.authUser) {
      searchCommunity(ui.search).then(async (results) => {
        for (const profile of results.people) state.profiles[profile.id] = await hydrateProfile(profile);
        for (const post of results.posts) if (post.profile) state.profiles[post.author] = await hydrateProfile(post.profile);
        state.searchResults = results; render();
      }).catch((error) => reportBackendError(error, "Could not search this hashtag."));
    } else {
      state.searchResults = {
        posts: state.posts.filter((post) => post.text.toLowerCase().includes(`#${button.dataset.tag.toLowerCase()}`)),
        people: [], groups: [],
      };
      render();
    }
  }
  if (action === "search-kind") { ui.searchKind = button.dataset.kind; render(); }
  if (action === "feed-filter") {
    ui.feedFilter = button.dataset.filter;
    if (ui.feedFilter === "recommended") {
      const posts = [...state.posts].sort((left, right) => right.comments.length - left.comments.length);
      state.posts = posts;
    }
    render();
  }
  if (action === "show-reactions") { ui.reactionPost = ui.reactionPost === id ? null : id; render(); }
  if (action === "set-reaction") {
    const post = state.posts.find((item) => item.id === id);
    if (post) {
      const kind = button.dataset.kind;
      const remove = post.reactionKind === kind;
      const wasLiked = post.liked;
      post.liked = !remove;
      post.reactionKind = remove ? null : kind;
      post.likes = Math.max(0, (post.likes || 0) + (!wasLiked && !remove ? 1 : wasLiked && remove ? -1 : 0));
      ui.reactionPost = null;
      render();
      if (post.remote && state.authUser) {
        setPostReaction({ postId: id, userId: state.authUser.id, kind, remove })
          .then(loadRemoteFeed)
          .catch((error) => reportBackendError(error, "Could not update your reaction."));
      } else save();
    }
  }
  if (action === "toggle-comments") {
    ui.expandedComments ||= [];
    ui.expandedComments = ui.expandedComments.includes(id) ? ui.expandedComments.filter((postId) => postId !== id) : [...ui.expandedComments, id];
    render();
    if (ui.expandedComments.includes(id)) document.querySelector(`[data-post="${CSS.escape(id)}"] [name="comment"]`)?.focus();
  }
  if (action === "reply-comment") {
    ui.replyTo = id; ui.replyToPost = button.dataset.post;
    ui.expandedComments ||= [];
    if (!ui.expandedComments.includes(ui.replyToPost)) ui.expandedComments.push(ui.replyToPost);
    render();
    document.querySelector(`[data-post="${CSS.escape(ui.replyToPost)}"] [name="comment"]`)?.focus();
  }
  if (action === "cancel-reply") { ui.replyTo = null; ui.replyToPost = null; render(); }
  if (action === "edit-comment") { ui.editCommentId = id; render(); }
  if (action === "cancel-comment-edit") { ui.editCommentId = null; render(); }
  if (action === "delete-comment") {
    const post = state.posts.find((item) => item.id === button.dataset.post);
    if (post?.remote && state.authUser) {
      deleteComment(id).then(loadRemoteFeed).catch((error) => reportBackendError(error, "Could not delete the comment."));
    } else if (post) {
      const deleted = new Set([id]);
      let foundChild = true;
      while (foundChild) {
        foundChild = false;
        post.comments.forEach((comment) => {
          if (deleted.has(comment.parentId) && !deleted.has(comment.id)) { deleted.add(comment.id); foundChild = true; }
        });
      }
      post.comments = post.comments.filter((comment) => !deleted.has(comment.id));
      save(); render(); toast("Comment deleted.");
    }
  }
  if (action === "comment-reaction") {
    const post = state.posts.find((item) => item.id === button.dataset.post);
    const comment = post?.comments.find((item) => item.id === id);
    if (comment) {
      const wasLiked = comment.liked;
      comment.liked = !wasLiked;
      comment.likes = Math.max(0, (comment.likes || 0) + (wasLiked ? -1 : 1));
      render();
      if (post.remote && state.authUser) {
        toggleCommentReaction(id, state.authUser.id, wasLiked).then(loadRemoteFeed)
          .catch((error) => reportBackendError(error, "Could not update your comment reaction."));
      } else save();
    }
  }
  if (action === "share-post") {
    const post = state.posts.find((item) => item.id === id);
    if (post) { post.shares = (post.shares || 0) + 1; addNotification("Your friend shared a post with you.", post.author); save(); render(); toast("Post shared with your friends."); }
  }
  if (action === "post-menu") { ui.menuPost = ui.menuPost === id ? null : id; render(); }
  if (action === "save-post" && backendConfigured && state.authUser) {
    const saved = state.saved.includes(id);
    savePost(id, state.authUser.id, saved).then(() => {
      state.saved = saved ? state.saved.filter((postId) => postId !== id) : [...state.saved, id];
      ui.menuPost = null; render(); toast(saved ? "Removed from saved." : "Post saved for later.");
    }).catch((error) => reportBackendError(error, "Could not save this post."));
  } else if (action === "save-post") {
    state.saved = state.saved.includes(id) ? state.saved.filter((item) => item !== id) : [...state.saved, id];
    ui.menuPost = null; save(); render(); toast(state.saved.includes(id) ? "Post saved for later." : "Removed from saved.");
  }
  if (action === "edit-post") { ui.menuPost = null; ui.modal = { type: "edit-post", id }; render(); }
  if (action === "pin-post") {
    const post = state.posts.find((item) => item.id === id);
    if (post?.remote && state.authUser) {
      togglePinPost(id, state.authUser.id, Boolean(post.pinned)).then(loadRemoteFeed)
        .catch((error) => reportBackendError(error, "Could not pin this post."));
    } else if (post) {
      post.pinned = !post.pinned; save(); render(); toast(post.pinned ? "Post pinned." : "Post unpinned.");
    }
    ui.menuPost = null;
  }
  if (action === "report-post") { ui.modal = { type: "report", id }; render(); }
  if (action === "delete-post") {
    const post = state.posts.find((item) => item.id === id);
    if (post?.remote && state.authUser) {
      deletePost(id).then(loadRemoteFeed).then(() => toast("Your post was deleted."))
        .catch((error) => reportBackendError(error, "Could not delete the post."));
    } else {
      state.posts = state.posts.filter((item) => item.id !== id);
      save(); render(); toast("Your post was deleted.");
    }
    ui.menuPost = null;
  }
  if (action === "add-friend" && backendConfigured && state.authUser) {
    createFriendRequest(state.authUser.id, id).then(loadRemoteConnections).then(() => toast("Friend request sent."))
      .catch((error) => reportBackendError(error, "Could not send the friend request."));
  } else if (action === "add-friend") {
    if (!state.outgoing.includes(id)) { state.outgoing.push(id); addNotification(`Friend request sent to ${person(id).name}.`); save(); render(); toast("Friend request sent."); }
  }
  if (action === "cancel-request" && backendConfigured && state.authUser) {
    const request = state.friendRequests.find((item) => item.requester_id === state.authUser.id && item.addressee_id === id);
    if (request) cancelFriendRequest(request.id).then(loadRemoteConnections).catch((error) => reportBackendError(error, "Could not cancel the friend request."));
  } else if (action === "cancel-request") { state.outgoing = state.outgoing.filter((item) => item !== id); save(); render(); }
  if ((action === "accept-friend" || action === "decline-friend") && backendConfigured && state.authUser) {
    const request = state.friendRequests.find((item) => item.id === button.dataset.requestId)
      || state.friendRequests.find((item) => item.requester_id === id && item.addressee_id === state.authUser.id);
    if (request) respondFriendRequest(request.id, action === "accept-friend" ? "accepted" : "rejected")
      .then(loadRemoteConnections)
      .then(() => action === "accept-friend" && toast(`You’re now friends with ${person(id).name}.`))
      .catch((error) => reportBackendError(error, "Could not update the friend request."));
  }
  if (action === "unfriend" && backendConfigured && state.authUser) {
    removeFriend(state.authUser.id, id).then(loadRemoteConnections).then(() => toast("Friend removed."))
      .catch((error) => reportBackendError(error, "Could not remove this friend."));
  }
  if (action === "accept-friend" && !(backendConfigured && state.authUser)) {
    state.incoming = state.incoming.filter((item) => item !== id);
    if (!state.friends.includes(id)) state.friends.push(id);
    addNotification(`You and ${person(id).name} are now friends.`, id); save(); render(); toast(`You’re now friends with ${person(id).name}.`);
  }
  if (action === "decline-friend" && !(backendConfigured && state.authUser)) { state.incoming = state.incoming.filter((item) => item !== id); save(); render(); toast("Request removed."); }
  if (action === "open-chat" && backendConfigured && state.authUser) {
    const existing = state.chats.find((chat) => chat.peerId === id);
    const open = async () => {
      const conversationId = existing?.id || await createConversation(id);
      if (!existing) state.chats.unshift({ id: conversationId, peerId: id, remote: true, unread: 0, messages: [] });
      ui.chatId = conversationId;
      ui.noticeOpen = false;
      const chat = state.chats.find((item) => item.id === conversationId);
      markChatAsRead(chat, false).catch((error) => reportBackendError(error, "Could not mark messages as read."));
      connectConversationRealtime(chat);
      render();
      document.querySelector('[name="message"]')?.focus();
    };
    open().catch((error) => reportBackendError(error, "Could not open this conversation."));
  } else if (action === "open-chat") { ui.chatId = id; ui.noticeOpen = false; const chat = state.chats.find((item) => item.id === id); if (chat) chat.unread = 0; save(); render(); document.querySelector('[name="message"]')?.focus(); }
  if (action === "toggle-follow" && backendConfigured && state.authUser) {
    const following = state.following.includes(id);
    toggleFollow(state.authUser.id, id, following).then((nowFollowing) => {
      state.following = nowFollowing ? [...state.following, id] : state.following.filter((item) => item !== id);
      render(); toast(nowFollowing ? `Following ${person(id).name}.` : `Unfollowed ${person(id).name}.`);
    }).catch((error) => reportBackendError(error, "Could not update following."));
  }
  if (action === "toggle-block" && backendConfigured && state.authUser) {
    const blocked = state.blocked.includes(id);
    toggleBlock(state.authUser.id, id, blocked).then(async (nowBlocked) => {
      state.blocked = nowBlocked ? [...state.blocked, id] : state.blocked.filter((blockedId) => blockedId !== id);
      await Promise.all([loadRemoteConnections(), loadRemoteFeed()]);
      toast(nowBlocked ? `${person(id).name} has been blocked.` : `${person(id).name} has been unblocked.`);
    }).catch((error) => reportBackendError(error, "Could not update blocked accounts."));
  }
  if (action === "toggle-chat") {
    if (ui.chatId) disconnectConversationRealtime();
    ui.chatId = ui.chatId ? null : "";
    render();
  }
  if (action === "close-chat") {
    ui.chatId = null;
    disconnectConversationRealtime();
    render();
  }
  if (action === "join-group") {
    if (backendConfigured && state.authUser) {
      joinGroup(id, state.authUser.id).then(loadRemoteCommunity).then(() => toast("You joined the group."))
        .catch((error) => reportBackendError(error, "Could not join this group."));
    } else {
      state.joinedGroups = state.joinedGroups.includes(id) ? state.joinedGroups.filter((item) => item !== id) : [...state.joinedGroups, id];
      save(); render(); toast(state.joinedGroups.includes(id) ? "You joined the group." : "You left the group.");
    }
  }
  if (action === "request-group" && backendConfigured && state.authUser) {
    requestGroupMembership(id).then(loadRemoteCommunity).then(() => toast("Your request to join was sent."))
      .catch((error) => reportBackendError(error, "Could not request to join this group."));
  }
  if (action === "review-group-request" && backendConfigured && state.authUser) {
    const groupId = button.dataset.group;
    const userId = button.dataset.user;
    const approve = button.dataset.approve === "true";
    reviewGroupJoinRequest(groupId, userId, approve).then(async () => {
      await loadRemoteCommunity();
      await refreshGroupRequests(groupId);
      render();
      toast(approve ? "The member was added to the group." : "The request was declined.");
    }).catch((error) => reportBackendError(error, "Could not update the group request."));
  }
  if (action === "leave-group" && backendConfigured && state.authUser) {
    const group = state.communities.find((item) => item.id === id);
    if (group?.role === "admin") { toast("Group owners can’t leave their own group."); }
    else leaveGroup(id, state.authUser.id).then(loadRemoteCommunity).then(() => toast("You left the group."))
      .catch((error) => reportBackendError(error, "Could not leave this group."));
  }
  if (action === "toggle-page-follow" && backendConfigured && state.authUser) {
    const page = state.pages.find((item) => item.id === id);
    if (page) togglePageFollow(id, state.authUser.id, page.followed).then(loadRemoteCommunity)
      .then(() => toast(page.followed ? "Page unfollowed." : "Page followed."))
      .catch((error) => reportBackendError(error, "Could not update page follow."));
  }
  if (action === "add-cart") { state.cart = state.cart.includes(id) ? state.cart.filter((item) => item !== id) : [...state.cart, id]; save(); render(); toast(state.cart.includes(id) ? "Added to your bag." : "Removed from your bag."); }
  if (action === "product-detail") { ui.modal = { type: "product", id }; render(); }
  if (action === "contact-seller") { const product = products.find((item) => item.id === id); ui.modal = null; ui.chatId = product?.seller || "maya"; render(); toast(`Message ${person(ui.chatId).name} to arrange a pickup.`); }
  if (action === "save-product") { state.savedProducts = state.savedProducts.includes(id) ? state.savedProducts.filter((item) => item !== id) : [...state.savedProducts, id]; save(); render(); toast(state.savedProducts.includes(id) ? "Listing saved." : "Listing removed from saved."); }
  if (action === "market-tab") { ui.marketTab = button.dataset.category; render(); }
  if (action === "play-video") { ui.modal = { type: "video", title: button.dataset.title }; render(); }
  if (action === "share-video") {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(button.dataset.title).then(() => toast("Video title copied.")).catch(() => toast("Could not access the clipboard."));
    else toast("Clipboard access is unavailable in this browser.");
  }
  if (action === "open-story") {
    const story = state.storyItems.find((item) => item.id === id) || stories.find((item) => item.id === id);
    if (story) {
      ui.modal = { type: "story", ...story }; render();
      if (story.author && story.author !== state.authUser?.id && state.authUser) {
        recordStoryView(story.id, state.authUser.id).then(loadRemoteCommunity)
          .catch((error) => reportBackendError(error, "Could not record this story view."));
      }
    }
  }
  if (action === "edit-profile") { ui.modal = { type: "profile" }; render(); }
  if (action === "clear-search") { ui.search = ""; navigate("home"); }
  if (action === "sort-feed") { state.posts.reverse(); save(); render(); toast("Feed order updated."); }
  if (action === "profile-tab") { ui.profileTab = button.dataset.tab; render(); }
  if (action === "view-photo") { const post = state.posts.find((item) => item.id === id); if (post) { ui.modal = { type: "photo", image: post.image, text: post.text }; render(); } }
  if (action === "market-category" || action === "change-location" || action === "open-groups-search") {
    const title = action === "change-location" ? "Marketplace location" : action === "open-groups-search" ? "Discover groups" : "Coming soon";
    const text = action === "change-location" ? "Marketplace listings are currently shown near New York, New York." : "This demo includes a curated selection of community groups and local marketplace listings.";
    ui.modal = { type: "info", title, text }; render();
  }
  if (action === "add-feeling") { const field = document.querySelector('[name="post"]'); if (field) { field.value += " 😊"; field.focus(); } }
  if (action === "toggle-mobile-menu") { document.querySelector(".left-sidebar")?.classList.toggle("mobile-open"); }
});

app.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const values = new FormData(form);
  if (form.id === "auth-form") {
    const mode = ui.authMode || "login";
    state.authBusy = true;
    ui.authMessage = "";
    ui.authError = false;
    render();
    const email = String(values.get("email") || "").trim().toLowerCase();
    const password = String(values.get("password") || "");
    const name = String(values.get("name") || "").trim();
    const action = mode === "signup"
      ? signUp({ email, password, name }).then((result) => {
        state.authBusy = false;
        if (!result.session) {
          ui.authMode = "login";
          ui.authMessage = "Account created. Check your email to verify your address before signing in.";
        }
        render();
      })
      : mode === "reset"
        ? sendPasswordReset(email).then(() => {
          state.authBusy = false;
          ui.authMode = "login";
          ui.authMessage = "If an account exists for that address, a password reset link is on its way.";
          render();
        })
        : mode === "update-password"
          ? updatePassword(password).then(() => {
            state.authBusy = false;
            ui.authMode = "login";
            ui.authMessage = "Password updated. You can continue using your account.";
            render();
          })
          : signIn({ email, password }).then(() => { state.authBusy = false; });
    action.catch((error) => reportBackendError(error, "Authentication failed. Please try again."));
  }
  if (form.id === "search-form") {
    ui.search = String(values.get("query") || "").trim();
    ui.view = "search"; ui.profileId = "you"; ui.noticeOpen = false; render();
    if (backendConfigured && state.authUser) {
      state.searchResults = null;
      searchCommunity(ui.search).then(async (results) => {
        for (const profile of results.people) state.profiles[profile.id] = await hydrateProfile(profile);
        for (const post of results.posts) if (post.profile) state.profiles[post.author] = await hydrateProfile(post.profile);
        state.searchResults = results;
        render();
      }).catch((error) => reportBackendError(error, "Could not search the community."));
    } else {
      state.searchResults = null;
    }
  }
  if (form.id === "post-form") {
    const text = String(values.get("post") || "").trim();
    const images = JSON.parse(form.dataset.images || "[]");
    const pollFields = form.querySelector("[data-poll-fields]");
    const pollOptions = !pollFields || pollFields.hidden
      ? []
      : values.getAll("poll-option").map((option) => String(option).trim()).filter(Boolean);
    if (form.dataset.poll === "true" && (
      pollOptions.length < 2
      || pollOptions.length > 4
      || new Set(pollOptions.map((option) => option.toLocaleLowerCase())).size !== pollOptions.length
    )) {
      toast("Add 2 to 4 distinct poll options.");
      return;
    }
    if (pollOptions.length && !text) { toast("Add a question for your poll."); return; }
    if (!text && !images.length) { toast("Add a message or photo before posting."); return; }
    const editingId = form.dataset.edit;
    if (editingId) {
      const post = state.posts.find((item) => item.id === editingId);
      if (!text) { toast("A post cannot be empty."); return; }
      if (post?.remote && state.authUser) {
        updatePost(editingId, state.authUser.id, { text }).then(loadRemoteFeed)
          .then(() => { ui.modal = null; render(); toast("Post updated."); })
          .catch((error) => reportBackendError(error, "Could not update the post."));
      } else if (post) {
        post.text = text; post.edited = true; save(); ui.modal = null; render(); toast("Post updated.");
      }
      return;
    }
    if (backendConfigured && state.authUser) {
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      submit.textContent = "Sharing…";
      const postAction = async () => {
        const imageUrls = await Promise.all(images.map((image) => uploadMedia(state.authUser.id, dataURLFile(image))));
        await createPost({
          userId: state.authUser.id,
          text,
          imageUrls,
          pollOptions,
          groupId: form.dataset.group || null,
          pageId: form.dataset.page || null,
          visibility: form.dataset.group || form.dataset.page ? "public" : "public",
        });
        await loadRemoteFeed();
        ui.modal = null; ui.view = "home"; render(); toast("Your post was shared with the community.");
      };
      postAction().catch((error) => {
        if (document.querySelector("#post-form [type=\"submit\"]")) {
          document.querySelector("#post-form [type=\"submit\"]").disabled = false;
          document.querySelector("#post-form [type=\"submit\"]").textContent = "Post";
        }
        reportBackendError(error, "Could not share your post.");
      });
    } else {
      const poll = pollOptions.length ? {
        options: pollOptions.map((option, index) => ({ id: `poll-${Date.now()}-${index}`, text: option, votes: 0 })),
        ownOptionId: null,
      } : null;
      state.posts.unshift({ id: `post-${Date.now()}`, author: "you", text, images, image: images[0] || "", poll, time: "Just now", likes: 0, comments: [], shares: 0, liked: false });
      addNotification("Your post is now on your profile.");
      save(); ui.modal = null; ui.view = "home"; render(); toast("Your post was shared.");
    }
  }
  if (form.id === "group-form") {
    const name = String(values.get("name") || "").trim();
    const description = String(values.get("description") || "").trim();
    if (!backendConfigured || !state.authUser) { toast("Connect Supabase to create a shared group."); return; }
    createGroup(state.authUser.id, { name, description, isPublic: values.get("privacy") === "public" })
      .then(async () => { ui.modal = null; await loadRemoteCommunity(); toast("Group created."); })
      .catch((error) => reportBackendError(error, "Could not create the group."));
  }
  if (form.id === "page-form") {
    const name = String(values.get("name") || "").trim();
    const description = String(values.get("description") || "").trim();
    if (!backendConfigured || !state.authUser) { toast("Connect Supabase to create a shared page."); return; }
    createPage(state.authUser.id, { name, description })
      .then(async () => { ui.modal = null; await loadRemoteCommunity(); toast("Page created."); })
      .catch((error) => reportBackendError(error, "Could not create the page."));
  }
  if (form.id === "story-form") {
    const file = values.get("story_media");
    const caption = String(values.get("caption") || "");
    if (!(file instanceof File) || !file.size) { toast("Choose a photo or video."); return; }
    if (file.size > 10 * 1024 * 1024) { toast("Stories must be smaller than 10 MB."); return; }
    if (!/^image\/(jpeg|png|webp|gif)$|^video\/(mp4|webm)$/.test(file.type)) { toast("Choose a JPG, PNG, WebP, GIF, MP4, or WebM file."); return; }
    if (backendConfigured && state.authUser) {
      createStory({ userId: state.authUser.id, file, caption })
        .then(async () => { ui.modal = null; await loadRemoteCommunity(); toast("Your story is live for 24 hours."); })
        .catch((error) => reportBackendError(error, "Could not publish your story."));
    } else {
      const image = await readDataURL(file).catch((error) => { toast(error.message); return ""; });
      if (!image) return;
      state.storyItems.unshift({
        id: `story-${Date.now()}`, author: "you", name: state.profile.name,
        avatar: state.profile.avatar, image, caption,
        kind: file.type.startsWith("video/") ? "video" : "image",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      ui.modal = null; render(); toast("Your story was added for this session.");
    }
  }
  if (form.id === "report-form") {
    const reason = String(values.get("reason") || "").trim();
    if (!backendConfigured || !state.authUser) { toast("Connect Supabase to submit a report."); return; }
    createReport({ userId: state.authUser.id, postId: form.dataset.post, reason })
      .then(() => { ui.modal = null; render(); toast("Thanks. Your report was sent for review."); })
      .catch((error) => reportBackendError(error, "Could not submit the report."));
  }
  if (form.id === "profile-form") {
    const name = String(values.get("name") || "").trim();
    const avatarValue = String(values.get("avatar") || "").trim();
    const coverValue = String(values.get("cover") || "").trim();
    if (!name) { toast("Please enter a name."); return; }
    if (avatarValue && !/^https?:\/\//i.test(avatarValue)) { toast("Enter a valid image URL."); return; }
    const avatarFile = values.get("avatar_file");
    const coverFile = values.get("cover_file");
    const profile = {
      ...state.profile,
      name,
      bio: String(values.get("bio") || "").trim(),
      avatar: avatarValue || state.profile.avatar,
      avatarPath: avatarValue !== state.profile.avatar ? "" : state.profile.avatarPath,
      cover: coverValue || state.profile.cover,
      coverPath: coverValue !== state.profile.cover ? "" : state.profile.coverPath,
      education: String(values.get("education") || ""),
      work: String(values.get("work") || ""),
      location: String(values.get("location") || ""),
      website: String(values.get("website") || ""),
      privacy: String(values.get("privacy") || state.profile.privacy || "public"),
    };
    if (backendConfigured && state.authUser) {
      const save = async () => {
        if (avatarFile instanceof File && avatarFile.size) {
          if (!/^image\/(jpeg|png|webp|gif)$/.test(avatarFile.type) || avatarFile.size > 10 * 1024 * 1024) throw new Error("Choose a supported profile photo under 10 MB.");
          profile.avatarPath = await uploadMedia(state.authUser.id, avatarFile);
          profile.avatar = await signedMediaURL(profile.avatarPath);
        }
        if (coverFile instanceof File && coverFile.size) {
          if (!/^image\/(jpeg|png|webp|gif)$/.test(coverFile.type) || coverFile.size > 10 * 1024 * 1024) throw new Error("Choose a supported cover photo under 10 MB.");
          profile.coverPath = await uploadMedia(state.authUser.id, coverFile);
          profile.cover = await signedMediaURL(profile.coverPath);
        }
        const savedProfile = await saveProfile(state.authUser.id, profile);
        state.profile = await hydrateProfile(savedProfile);
        state.profiles[state.authUser.id] = state.profile;
        ui.modal = null; render(); toast("Profile updated.");
      };
      save().catch((error) => reportBackendError(error, "Could not save your profile."));
    } else {
      const updateDemoProfile = async () => {
        if (avatarFile instanceof File && avatarFile.size) profile.avatar = await readDataURL(avatarFile);
        if (coverFile instanceof File && coverFile.size) profile.cover = await readDataURL(coverFile);
        state.profile = profile;
        save(); ui.modal = null; render(); toast("Profile updated.");
      };
      updateDemoProfile().catch((error) => toast(error.message));
    }
  }
  if (form.classList.contains("comment-form")) {
    const text = String(values.get("comment") || "").trim();
    if (!text) return;
    const post = state.posts.find((item) => item.id === form.dataset.post);
    if (post) {
      if (post.remote && state.authUser) {
        createComment({ postId: post.id, userId: state.authUser.id, text, parentId: form.dataset.parent })
          .then(loadRemoteFeed)
          .then(() => {
            ui.expandedComments ||= [];
            if (!ui.expandedComments.includes(post.id)) ui.expandedComments.push(post.id);
            ui.replyTo = null; ui.replyToPost = null;
            render();
            document.querySelector(`[data-post="${CSS.escape(post.id)}"] [name="comment"]`)?.focus();
          })
          .catch((error) => reportBackendError(error, "Could not add your comment."));
        return;
      }
      post.comments ||= [];
      post.comments.push({ id: `comment-${Date.now()}`, author: "you", parentId: form.dataset.parent || null, text, time: "Just now", likes: 0, liked: false });
      ui.replyTo = null; ui.replyToPost = null;
      if (!ui.expandedComments?.includes(post.id)) ui.expandedComments = [...(ui.expandedComments || []), post.id];
      save(); render(); document.querySelector(`[data-post="${CSS.escape(post.id)}"] [name="comment"]`)?.focus();
    }
  }
  if (form.classList.contains("comment-edit-form")) {
    const text = String(values.get("comment") || "").trim();
    if (!text) return;
    const post = state.posts.find((item) => item.id === form.dataset.post);
    const comment = post?.comments.find((item) => item.id === form.dataset.comment);
    if (post?.remote && comment) {
      editComment(comment.id, text).then(loadRemoteFeed).catch((error) => reportBackendError(error, "Could not update the comment."));
    } else if (comment) {
      comment.text = text; comment.time = "Edited just now";
      save(); render(); toast("Comment updated.");
    }
    ui.editCommentId = null;
  }
  if (form.classList.contains("chat-compose")) {
    const text = String(values.get("message") || "").trim();
    const attachment = values.get("attachment");
    const file = attachment instanceof File && attachment.size ? attachment : null;
    clearTimeout(typingBroadcastTimer);
    broadcastTyping(false);
    if (!text && !file) return;
    const chat = state.chats.find((item) => item.id === form.dataset.chat);
    if (chat?.remote && state.authUser) {
      if (file && (!messageAttachmentTypes.has(file.type) || file.size > 10 * 1024 * 1024)) {
        toast("Choose a supported image or file smaller than 10 MB.");
        return;
      }
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      const send = async () => {
        let attachmentPath = null;
        if (file) attachmentPath = await uploadMedia(state.authUser.id, file);
        let message;
        try {
          message = await sendMessage({
            conversationId: chat.id,
            userId: state.authUser.id,
            text,
            attachmentPath,
            attachmentName: file?.name || null,
            attachmentType: file?.type || null,
          });
        } catch (error) {
          if (attachmentPath) {
            try { await removeMedia(attachmentPath); }
            catch (cleanupError) { console.error("Could not clean up an unsent message attachment:", cleanupError); }
          }
          throw error;
        }
        const currentChat = state.chats.find((item) => item.id === chat.id) || chat;
        if (!currentChat.messages.some((item) => item.id === message.id)) currentChat.messages.push({
          id: message.id,
          from: message.sender_id,
          text: message.body,
          attachmentURL: message.attachment_url ? await signedMediaURL(message.attachment_url) : null,
          attachmentName: message.attachment_name,
          attachmentType: message.attachment_type,
          createdAt: message.created_at,
          time: new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        });
        render();
        document.querySelector('[name="message"]')?.focus();
      };
      send().catch((error) => reportBackendError(error, "Could not send your message."))
        .finally(() => { if (submit.isConnected) submit.disabled = false; });
      return;
    }
    if (file) {
      toast("Connect Supabase to send image and file attachments.");
      return;
    }
    if (chat) {
      chat.messages.push({ from: "you", text, time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
      save(); render(); document.querySelector('[name="message"]')?.focus();
    }
  }
});

app.addEventListener("change", async (event) => {
  const input = event.target;
  if (input instanceof HTMLInputElement && input.name === "attachment") {
    const file = input.files?.[0];
    if (file && (!messageAttachmentTypes.has(file.type) || file.size > 10 * 1024 * 1024)) {
      toast("Choose a supported image or file smaller than 10 MB.");
      input.value = "";
    }
    const label = input.closest(".chat-compose")?.querySelector(".chat-attachment-name");
    if (label) label.textContent = input.files?.[0]?.name || "";
  }
  if (input instanceof HTMLInputElement && input.name === "photo" && input.files?.[0]) {
    const files = [...input.files];
    if (files.length > 5) { toast("Choose no more than 5 photos for one post."); input.value = ""; return; }
    if (files.some((file) => !file.type.startsWith("image/"))) { toast("Choose image files only."); input.value = ""; return; }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) { toast("Each photo must be smaller than 10 MB."); input.value = ""; return; }
    try {
      const images = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const objectURL = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) { URL.revokeObjectURL(objectURL); reject(new Error("Could not process that image.")); return; }
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL("image/jpeg", 0.76);
          URL.revokeObjectURL(objectURL);
          resolve(dataURL);
        };
        image.onerror = () => { URL.revokeObjectURL(objectURL); reject(new Error(`Could not read ${file.name}.`)); };
        image.src = objectURL;
      })));
      const totalSize = images.reduce((total, image) => total + image.length, 0);
      if (totalSize > 4_000_000) { toast("Choose smaller photos; the compressed total must be under 4 MB."); input.value = ""; return; }
      const form = document.querySelector("#post-form");
      if (!form) return;
      form.dataset.images = JSON.stringify(images);
      document.querySelector("#image-preview").innerHTML = images.map((image, index) => `<img src="${imageURL(image)}" alt="Selected photo ${index + 1}">`).join("")
        + `<button type="button" class="plain-icon" data-action="remove-photo" aria-label="Remove photos">${icon("close", 17)}</button>`;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not read those images.");
    }
  }
});

app.addEventListener("click", (event) => {
  if (event.target.closest('[data-action="remove-photo"]')) {
    const form = document.querySelector("#post-form");
    if (form) delete form.dataset.images;
    document.querySelector("#image-preview").innerHTML = "";
  }
});

app.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && (ui.modal || ui.chatId || ui.noticeOpen)) {
    ui.modal = null;
    if (ui.chatId) disconnectConversationRealtime();
    ui.chatId = null; ui.noticeOpen = false; render();
  }
});

render();
initializeBackend();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Could not register the offline app shell:", error));
}
