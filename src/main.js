// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
// Para Bootstrap
import Popper from 'popper.js'
window.Popper=Popper
require('bootstrap')
import 'bootstrap/dist/css/bootstrap.css';

// App propia de Vue
import Vue from 'vue'
import App from './App'
import router from './router'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
