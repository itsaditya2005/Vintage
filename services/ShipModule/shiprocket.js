const mm = require('../../utilities/globalModule');
const request = require('request');
const applicationkey = process.env.APPLICATION_KEY;

exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];

    generateToken(supportKey,(err,result)=>
    {
        if(err)
        {
            res.status(400).json({
                "message": "Failed to get customerProductFeedback count.",
            });
        }
        else
        {
            res.status(200).json({
                "message": "sucess",
                "token":result
            });
        }
    })
}


function generateToken(supportKey,callback) {
    try {
        mm.executeQuery('select * from shiprocket_login_info where 1 order by ID DESC LIMIT 1 ', supportKey, (error, results) => {
            if (error) {
                console.log(error);
                return callback(error,null) 
            }
            else {
                if (results.length > 0) {
                    return callback(null,results[0].TOKEN)
                }
                else {
                    var options = {
                        url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: {
                            "email": "rajdoot.herlekar@gttdata.ai",
                            "password": "Raj2204#"
                        },
                        method: "post",
                        json: true
                    }
                    request(options, (error, response, body) => {
                        if (error) {
                            console.log("request error -send email ", error);
                            return  callback(error,null) 
                        } else {
                            mm.executeQueryData('insert into  shiprocket_login_info (COMPANY_ID,CREATED_AT,EMAIL,FIRST_NAME,SHIPROCKET_ID,LAST_NAME,TOKEN,CLIENT_ID) VALUES (?,?,?,?,?,?,?,?)', [body.company_id,body.created_at,body.email,body.first_name,body.id,body.last_name,body.token,"1"], supportKey, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    return callback(error,null) 
                                }
                                else {
                                    return callback(null,body.token)
                                }
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}