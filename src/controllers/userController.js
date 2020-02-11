const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mysql = require('../../mysql');

module.exports = {
    insert_user (req, res, next) {
        var datetime = new Date();
        const created_date = (datetime.toISOString().slice(0,10));
        
        mysql.getConnection((err, conn) => {
            if (err) {
                return res.status(500).send({error: err});
            } else {
                conn.query('select 1 from users where email = ?', [req.body.email], (err, results) => {
                    if (err) {
                        return res.status(500).send({error: err})
                    } else if (results.length > 0) {
                        res.status(500).send({error: "Usuario já cadastrado!"});
                    } else {
                    bcrypt.hash(req.body.pwd, 10 , (errBcrypt, hash) => {
                        if (err) {
                            res.status(500).send({error: errBcrypt});
                        } else {
                            conn.query(
                                `insert into users 
                                (email, username, first_name, last_name, pwd, category, institution ,born_date, city, state, country, points_user, created_date, img_path)`
                                + `values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, 
                                [
                                    req.body.email,
                                    `@${req.body.username}`,
                                    req.body.first_name,
                                    req.body.last_name,
                                    hash,
                                    req.body.category,
                                    req.body.institution,
                                    req.body.born_date,
                                    req.body.city,
                                    req.body.state,
                                    req.body.country,
                                    0,
                                    created_date,
                                    null
                                ],
                                (error, results, fields) => {
                                    conn.release();
                                    if (error) {
                                        res.status(500).send({
                                            error: error
                                        });
                                    } else {
                                        let token = jwt.sign({
                                            email: req.body.email,
                                            pwd: req.body.pwd,
                                            id_user: req.body.id_user
                                        }, 'NerdevyTokenKeyS2',{});
                                        res.status(201).send({
                                            id_user: results.insertId,
                                            token: token
                                        });
                                    }
                                });
                            }
                        })
                    }
                });
            }
        })
    },
    login (req, res, next) {
        mysql.getConnection((err, conn) => {
            if (err) {
                return res.status(500).send({error:err})
            }
            conn.query(`select * from users where email = ?`,[req.body.email], (error, results) => {
                conn.release();
                if (error) {
                    return res.status(500).send({error:error})
                }
                if (results.length < 1) {
                    return res.status(404).send({error: 'Usuario não exite no banco!'})
                }
                else {
                    bcrypt.compare(req.body.pwd, results[0].pwd, (errBcrypt, result) => {
                        if (errBcrypt) {
                            return res.status(401).send({error: 'Erro senha'})
                        }
                        if (result) {
                            let token = jwt.sign({
                                email: results[0].email,
                                first_name: results[0].first_name,
                                id_user: results[0].id_user
                            }, 'NerdevyTokenKeyS2',{});
                            return res.status(200).send({
                                email: results[0].email,
                                username: results[0].username,
                                id_user: results[0].id_user,     
                                token: token,
                                message: 'Success'
                            });
                        } else {
                            return res.status(401).send({error: 'Falha na autenticação'})
                        }
                    });
                }
            }); 
        });
    },
    list (req, res, next) {
        mysql.getConnection((err, conn) => {
            if (err) {
                return res.status(500).send({
                    err : err
                })
            } else {
                conn.query(`select * from users`, (error, results, fields) => {
                    conn.release();
                    if (error) {
                        return res.status(500).send({ error: error})
                    }
                    else {
                        return res.status(201).send({ results: results})
                    }
                })
            }
        })
    },

    view (req, res, next) {
        mysql.getConnection((err, conn) => {
            if (err) {
                return res.status(500).send({
                    err : err
                })
            } else {
                conn.query(`select * from users where username=?`,req.body.username, 
                (error, results, fields) => {
                    conn.release();
                    if (error) {
                        return res.status(500).send({ error: error})
                    }
                    if (results.length === 0) {
                        return res.status(404).send({ message: 'Usuario não existe'})
                    }
                    else {
                        return res.status(201).send(results)
                    }
                })
            }
        })
    },
    edit (req, res) {
        const { OldEmail, email, first_name, last_name, category, institution, born_date, state, city, country, img_path } = req.body;

        mysql.getConnection((err, conn) => {
            if (err) {
                return res.status(500).send({error:err})
            } 
            if (req.body.pwd){
                if (req.body.pwd !== null && req.body.pwd !== '') {
                bcrypt.hash(req.body.pwd, 10 , (errBcrypt, hash) => {
                    if(errBcrypt){
                        return res.status(500).send({error: errBcrypt})
                    } conn.query(`UPDATE Users 
                                    SET email = ?, first_name = ?, last_name = ?, pwd = ?, category = ?, institution = ?, born_date = ?,
                                        state = ?, city = ?, country = ?
                                    WHERE email = ?`, 
                    [
                        email, first_name, last_name, hash, category, institution, born_date, state, city, country, OldEmail
                    ], (err, response) => {
                        conn.release();
                        if (err) {
                            return res.status(500).send({error: err})
                        } return res.status(200).send({message: `${email} editado`, response: response})
                    })
                })
            } else if (img_path && req.body.pwd !== null && req.body.pwd !== '') {
                bcrypt.hash(req.body.pwd, 10 , (errBcrypt, hash) => {
                    if(errBcrypt){
                        return res.status(500).send({error: errBcrypt})
                    } conn.query(`UPDATE Users 
                                    SET email = ?, first_name = ?, last_name = ?, pwd = ?, category = ?, institution = ?, born_date = ?,
                                        state = ?, city = ?, country = ?, img_path = ? 
                                    WHERE email = ?`, 
                    [
                        email, first_name, last_name, hash, category, institution, born_date, state, city, country, img_path, OldEmail
                    ], 
                    (err, response) => {
                        conn.release();
                        if (err) {
                            return res.status(500).send({error: err})
                        } return res.status(200).send({message: `${email} editado`, response: response})
                    })
                })}
            } else if (img_path) {
                conn.query(`UPDATE Users 
                                SET email = ?, first_name = ?, last_name = ?, category = ?, institution = ?, born_date = ?, state = ?,
                                    city = ?, country = ?, img_path = ? 
                                WHERE email = ?`, 
                [
                    email, first_name, last_name, category, institution, born_date, state, city, country, img_path, OldEmail
                ],(err, response) => {
                    conn.release();
                    if (err) {
                        return res.status(500).send({error: err})
                    } return res.status(200).send({message: `${email} editado`, response: response})
                })
            } else {
                conn.query(`UPDATE Users 
                                SET email = ?, first_name = ?, last_name = ?, category = ?, institution = ?, born_date = ?, state = ?,
                                    city = ?, country = ? 
                                WHERE email = ?`, 
                [
                    email, first_name, last_name, category, institution, born_date, state, city, country, OldEmail
                ],(err, response) => {
                    conn.release();
                    if (err) {
                        return res.status(500).send({error: err})
                    } return res.status(200).send({message: `${email} editado`, response: response})
                })
            };
        })
    }
}