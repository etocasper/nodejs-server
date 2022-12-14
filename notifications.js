'use strict'

const jwt = require('jsonwebtoken')
const db = require('./Database/database')
const response = require('./response')

exports.sendNotification = async (user, title, text) => {
    if (user && title && text) {
        db.query("INSERT INTO `notifications` (`user_id`, `title`, `text`) VALUES (" + user + ", '" + title + "', '" + text + "')", (error) => {
            if (error) console.log(error)
        })
    }
}

exports.getNotifications = async (req, res) => {
    var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
    if (tokenPayload) {
        db.query("SELECT * FROM `notifications` WHERE `user_id` = " + tokenPayload.user_id + " OR `user_id` is NULL" , (error, rows) => {
            if (error) response.send(400, error, res)
            else response.send(200, rows, res)
        })
    }
}
