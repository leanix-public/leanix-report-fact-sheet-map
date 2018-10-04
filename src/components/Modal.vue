<template>
 <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            <slot name="header">
              default header
            </slot>
          </div>

          <div class="modal-body">
            <slot name="body">
              default body
            </slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              default footer
              <button class="modal-default-button" @click="$emit('close')">
                OK
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    show: Boolean
  }
}
</script>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: calc(100% - 10px);
  height: calc(100% - 10px);
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 600px;
  margin: 30px auto;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,.2);
  box-shadow: 0 5px 15px rgba(0,0,0,.5);
  transition: all .3s ease;
  background-clip: padding-box;

}

.modal-header {
  background-color: #f2f2f2;
  border-radius: 6px 6px 0 0;
  padding: 15px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  flex-flow: row;
}

.modal-header h4 {
  font-size: 15px;
  margin: 0;
  line-height: 1.428571429;
  font-weight: 500;
}

.modal-body {
  margin: 20px 0;
  padding: 15px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  background-color: #f2f2f2;
  padding: 15px;
  text-align: right;
  border-top: 1px solid #e5e5e5;
  border-radius: 0 0 6px 6px;
}

/*
 * The following styles are auto-applied to elements with
 * transition="modal" when their visibility is toggled
 * by Vue.js.
 *
 * You can easily play with the modal transition by editing
 * these styles.
 */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
