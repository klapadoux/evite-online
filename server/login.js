module.exports.checkSocketState = (socket) => {
  return 'undefined' !== typeof socket.isLoggedIn
}
