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
    app.route('/api/profile/image').post(passport.authenticate('jwt', {session: false}), UserController.updateProfilePicture)
    app.route('/api/profile/data').post(passport.authenticate('jwt', {session: false}), UserController.updateData)

    //---------------------------------------ModRequests--------------------------------------------------------
    app.route('/api/mods').get(passport.authenticate('jwt', {session: false}), ModController.getAllMods)
    app.route('/api/mod/').get(ModController.getModInfo)
    app.route('/api/search/').get(ModController.search)
    app.route('/api/upload').post(passport.authenticate('jwt', {session: false}), ModController.upload)
    app.route('/api/download').get(/*passport.authenticate('jwt', {session: false}),*/ ModController.download)

    //---------------------------------------CommentRequests-----------------------------------------------------
    app.route('/api/comment/publish').post(passport.authenticate('jwt', {session: false}), CommentController.publishComment)
    app.route('/api/comment/get').get(CommentController.getComments)

    //---------------------------------------CollectionRequests--------------------------------------------------
    app.route('/api/collection/create').post(passport.authenticate('jwt', {session: false}), CollectionController.create)
    app.route('/api/collection/add').get(passport.authenticate('jwt', {session: false}), CollectionController.addToCollection)
    app.route('/api/collection/image').post(passport.authenticate('jwt', {session: false}), CollectionController.addImage)
    app.route('/api/collection/remove').post(passport.authenticate('jwt', {session: false}), CollectionController.removeFromCollection)
    app.route('/api/collection/get').get(CollectionController.get)
    app.route('/api/collection/download').get(CollectionController.download)

    //---------------------------------------NotificationRequests--------------------------------------------------
    app.route('/api/notifications/get').get(passport.authenticate('jwt', {session: false}), notify.getNotifications)
}
