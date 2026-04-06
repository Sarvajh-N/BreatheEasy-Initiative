// =============================================
// BreatheEasy — Service Worker
// =============================================
// A service worker runs in the background, separate from the web page.
// It lets the app work OFFLINE by caching files the first time the user visits.
// Next time they open the app (even without internet), it loads from cache.
//
// This is what makes it feel like a real app instead of a website.
// =============================================

// CACHE_NAME is a version label. When you update the app, change this string
// (e.g., 'breatheasy-v2') so the service worker knows to re-download everything.
var CACHE_NAME = 'breatheasy-v2';

// List of files to cache when the service worker is first installed.
// These are all the files needed to run the app offline.
var FILES_TO_CACHE = [
  './',
  './index.html',
  './b/index.html',
  './style.css',
  './app.js',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  './lungs.avif'
];

// ---- INSTALL EVENT ----
// Fires when the service worker is first registered (first visit).
// We open a cache and store all our app files.
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  // Skip waiting so the new service worker activates immediately
  self.skipWaiting();
});

// ---- ACTIVATE EVENT ----
// Fires when a new service worker takes over.
// We delete old caches so the user gets the latest version.
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ---- FETCH EVENT ----
// Fires every time the app requests a file (HTML, CSS, JS, images, etc.).
// Strategy: "Network first, fall back to cache"
// - Try to get the latest version from the network
// - If offline, serve the cached version instead
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // If we got a good response, cache it for offline use
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network failed — serve from cache (offline mode)
        return caches.match(event.request);
      })
  );
});
