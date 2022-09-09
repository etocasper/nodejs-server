'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const response = require('../response')
const db = require('../Database/database')
const config = require('./../configuration')

function isExt(filename, extensions /* .exe */) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? false : (extensions.includes(filename.substr(i)));
}

exports.getAllUsers = async (req, res) => {
    try {
        db.query('SELECT `id`, `login`, `email`, `reg_date`, `profile_description` FROM `users`', (error, rows, fields) => {
            if(error) {
                response.send(400, error, res)
            } else {
                response.send(200, rows, res)
            }
        })
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.signUp = async (req, res) => {
    try {
        db.query("SELECT `id`, `email`, `login` FROM `users` WHERE `email` = '" + req.body.email + "' OR `login` = '" + req.body.login + "'", (error, rows, fields) => {
            if (error) {
                response.send(400, error, res)
            } else if (typeof rows !== 'undefined' && rows.length > 0) {
                const row = JSON.parse(JSON.stringify(rows))
                row.map(rw => {
                    response.send(302, {message: `User with this login or email has already been registered`}, res)
                    return true;
                })
            } else {
                const email = req.body.email
                const login = req.body.login
                const salt = bcrypt.genSaltSync(15)
                const password = bcrypt.hashSync(req.body.password, salt)

                const sql = "INSERT INTO `users` (`login`, `name`, `email`, `password`, `permission`) VALUES('" + login + "', '" + login + "', '" + email + "', '" + password + "', 'user')";
                db.query(sql, (error, results) => {
                    if(error) {
                        response.send(400, error, res)
                    } else {
                        response.send(200, {message: `Successful registration`, results}, res)
                    }
                })
            }
        })
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.signIn = async (req, res) => {
    try {
        db.query("SELECT `id`, `email`, `password` FROM `users` WHERE `email` = '" + req.body.email + "'", (error, rows, fields) => {
            if(error) {
                response.send(400, error, res)
            } else if(rows.length <= 0) {
                response.send(401, {message: "There is no user with such an email, please register"}, res)
            } else {
                const row = JSON.parse(JSON.stringify(rows))
                row.map(rw => {
                    const password = bcrypt.compareSync(req.body.password, rw.password)
                    if(password) {
                        const token = jwt.sign({
                            user_id: rw.id,
                            email: rw.email
                        }, config.JWTSECRET, { expiresIn: "14d" }) // 2 weeks
                        response.send(200, {token: `Bearer ${token}`}, res)
                    } else response.send(401, {message: "The password is incorrect"}, res)
                    return true;
                })
            }
        })
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.updateProfilePicture = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.headers.authorization.replace('Bearer ',''));
        let imageExtentions = ['.jpg', '.jpeg', '.png'];
        let imageName = req.files.image.name;
        if (tokenPayload) {
            if (req.files) {
                if (Object.prototype.hasOwnProperty.call(req.files, 'image')) {
                    if (req.files.image.size <= config.UPLOAD_MAX_PICTURE_SIZE) {
                        if (isExt(req.files.image.name.toLowerCase(), imageExtentions)) {
                            req.files.image.mv(config.PROJECT_DIR + '/Uploads/ProfilePictures/' + tokenPayload.user_id + ".png")
                                .then(() => {
                                    let filepath = '/Uploads/ProfilePictures/' + tokenPayload.user_id + ".png";
                                    const sql = "UPDATE `users` SET `profile_picture` = '" + filepath + "' WHERE `users`.`id` = " + tokenPayload.user_id;
                                    db.query(sql, (error, results) => {
                                        if(error) response.send(400, error, res)
                                        else response.send(200, {message: `Profile picture successful updated`, results}, res)
                                    })
                                }).catch(error => response.send(400, `Image upload failure [${error.message}]`, res))
                        } else response.send(400, "The image extension should be suitable", res)
                    } else response.send(400, "The image size must be less than 10 MB", res)
                } else response.send(400, "You should to upload the image with 'image' attribute", res)
            } else response.send(400, "You should to upload the image", res)
        } else response.send(400, "Token required", res)
    } catch (e) {response.send(400, e.toString(), res)}
}

exports.updateData = async (req, res) => {
    try {
        var tokenPayload = jwt.decode(req.body.token);
        var queryArr = [];
        const login = req.body.login
        const email = req.body.email
        const profile_description = req.body.profile_description

        if (login) queryArr.push("`login` = '" + login + "'");
        if (email) queryArr.push("`email` = '" + email + "'");
        if (profile_description) queryArr.push("`profile_description` = '" + profile_description + "'");

        let finalQuery = queryArr.join(", ")

        if (tokenPayload) {
            db.query("UPDATE `users` SET" + finalQuery + "WHERE `users`.`id` = " + tokenPayload.user_id, (error, rows, fields) => {
                if(error) {
                    response.send(400, error, res)
                } else {
                    response.send(200, rows, res)
                }
            })
        } else response.send(400, "Token required", res)
    } catch (e) {response.send(400, e.toString(), res)}
}
