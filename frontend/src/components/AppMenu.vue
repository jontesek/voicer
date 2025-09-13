<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
    <div class="container">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link to="/create-audio" class="nav-link" active-class="active"
              >Create Audio</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/audio-list" class="nav-link" active-class="active"
              >Audio List</router-link
            >
          </li>
          <li class="nav-item">
            <router-link to="/account-stats" class="nav-link" active-class="active"
              >Account stats</router-link
            >
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Adjust active link styling to ensure visibility with Bootstrap's dark background */
.nav-link.active {
  font-weight: bold;
  color: #fff !important; /* Important to override Bootstrap's default link color */
}

.nav-link {
  /* color: rgb(155, 164, 197); */
  font-size: 1.1em;
}
</style>
