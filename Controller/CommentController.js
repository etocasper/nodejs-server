'use strict'

const jwt = require('jsonwebtoken')
const response = require('../response')
const db = require('../Database/database')
const notify = require('../notifications')

exports.publishComment = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        if (tokenPayload) {
            const mod_id = req.body.mod_id
            const text = req.body.text
            db.query("INSERT INTO `comments` (`id`, `user_id`, `mod_id`, `text`) VALUES (NULL, '" + tokenPayload.user_id + "', '" + mod_id + "', '" + text + "')", (error, rows, fields) => {
                if(error) {
                    response.send(400, error, res)
                } else {
                    response.send(200, rows, res)
                }
            })
        } else response.send(400, `Token required`, res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.getComments = async (req, res) => {
    try {
        if (req.query.id) {
            db.query("SELECT * FROM `comments` WHERE mod_id =" + req.query.id, (error, rows, fields) => {
                if(!error) {
                    var commentRows = rows;
                    var commentIterator = 0;
                    commentRows.forEach((comment, index) => {
                        db.query("SELECT `name`, `login`, `profile_picture` FROM users WHERE id = " + comment.user_id,  (error, rows, fields) => {
                            commentIterator++;
                            commentRows[index]['userdata'] = rows[0]; 
                            if (commentIterator === commentRows.length) {
                                response.send(200, commentRows, res);
                            }
                        })
                    });
                } else response.send(400, error, res)
            })
        } else response.send(400, 'The `id` parameter is missing', res);
    } catch (e) {response.send(400, e.toString(), res)}
}