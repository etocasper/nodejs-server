'use strict'

module.exports = (app) => {
    const UserController = require('./Controller/UserController')
    const ModController = require('./Controller/ModController')
    const CommentController = require('./Controller/CommentController')
    const CollectionController = require('./Controller/CollectionController')

    const notify = require('./notifications')
    const passport = require('passport')

    //---------------------------------------UserRequests-------------------------------------------------------
    app.route('/api/users').get(passport.authenticate('jwt', {session: false}), UserController.getAllUsers)
    app.route('/api/auth/signup').post(UserController.signUp)
    app.route('/api/auth/signin').post(UserController.signIn)
    app.route('/api/profile/data').post(passport.authenticate('jwt', {session: false}), UserController.updateData)

    //---------------------------------------ModRequests--------------------------------------------------------
    app.route('/api/mods').get(passport.authenticate('jwt', {session: false}), ModController.getAllMods)
    app.route('/api/mod/').get(ModController.getModInfo)
    app.route('/api/search/').get(ModController.search)

    //---------------------------------------CommentRequests-----------------------------------------------------
    app.route('/api/comment/publish').post(passport.authenticate('jwt', {session: false}), CommentController.publishComment)
    app.route('/api/comment/get').get(CommentController.getComments)

    //---------------------------------------NotificationRequests--------------------------------------------------
    app.route('/api/notifications/get').get(passport.authenticate('jwt', {session: false}), notify.getNotifications)
}
