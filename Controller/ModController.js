'use strict'

const jwt = require('jsonwebtoken')
const response = require('../response')
const db = require('../Database/database')
const config = require('./../configuration')
const btoa = require('btoa');

function removeForbiddenCharacters(input) {
    let forbiddenChars = ['/', '?', '&','=','.','"', " "]
    for (let char of forbiddenChars)
        input = input.split(char).join('');
    return input
}

function isExt(filename, extensions /* ['.exe', '.pdf', '.etc'] */) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? false : (extensions.includes(filename.substr(i)));
}

function hasProperty(target, name) {
    return Object.prototype.hasOwnProperty.call(target, name) ? true : false
}

exports.search = async (req, res) => {
    if (req.query.query) {
        db.query(`SELECT * FROM mods WHERE title LIKE '%${req.query.query}%'`, (error, rows) => {
            if (!error) response.send(200, rows, res)
            else response.send(400, error, res)
        })
    } else response.send(400, 'The `id` parameter is missing', res)
}

exports.getModInfo = async (req, res) => {
    if (req.query.id) {
        db.query('SELECT * FROM `mods` WHERE id = ' + req.query.id, (error, rows) => {
            let modRows = rows[0];
            if (!error) {
                db.query('SELECT `path` FROM `mod_pictures` WHERE mod_id = ' + req.query.id, (error, rows) => {
                    if (!error) {
                        let pathArr = []
                        rows.forEach(item => pathArr.push(item.path));
                        modRows['detail_pictures'] = pathArr;
                        response.send(200, modRows, res)
                    } else response.send(400, error, res)
                })
            } else response.send(400, error, res)
        })
    } else response.send(400, 'The `id` parameter is missing', res)
}

exports.getAllMods = async (req, res) => {
    db.query('SELECT * FROM mods', (error, rows) => {
        if (error) response.send(400, error, res)
        else response.send(200, rows, res)
    })
}
