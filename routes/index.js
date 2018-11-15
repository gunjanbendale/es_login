var express = require('express');
var router = express.Router();
var bcrypt=require('bcryptjs');
var mysql=require('mysql');
var bcrypt=require('bcryptjs');
var jwt=require('jsonwebtoken');


const secret='valofsecret';
var con = mysql.createConnection({
  host: "localhost",
  user: "jarvis",
  password: "windows7",
  database: "equipshare"
});


/* GET home page. */
router.get('/',isAuthenticated, function(req, res, next) {
  res.json({msg:'Login valid'});
});
router.post('/signup',function(req,res){
  let name =req.body.name;
  let email=req.body.email;
  let mobile=req.body.mobile;
  let password= req.body.password;
  let password2=req.body.password2;
  let address=req.body.address;
  let category=req.body.category;

  req.checkBody('name', 'Name cannot be empty').notEmpty();
  req.checkBody('email', 'Email cannot be empty').notEmpty();
  req.checkBody('mobile', 'mobile cannot be empty').notEmpty();
  req.checkBody('email', "Enter a valid email").isEmail();
  req.checkBody('address', 'Address cannot be empty').notEmpty();
  req.checkBody('category', 'Category cannot be empty').notEmpty();
  req.checkBody('password', 'password cannot be empty').notEmpty();
  req.checkBody('password2', 'confirm password cannot be empty').notEmpty();
  req.checkBody('password', 'Passwords do not match').equals(password2);

  let errors=req.validationErrors();
  if(errors) res.json({
    error:errors
  });
  else{
  var newUser=({
      name:name,
      email:email,
      mobile:mobile,
      password:password,
      password2:password2,
      address:address,
      category:category
  });
 
  let user_check_query=`select * from user_details where email='${email}'`;
  console.log(user_check_query);
  con.query(user_check_query,function(err,result){
    if (err) throw err;
    if(!result.length<=0)
    { console.log(result);
      res.json({msg:'User Already exists'});
    }
  else{
//console.log(newUser);
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        newUser.password=hash;
                console.log("db connected");
                let sql_query=`insert into user_details(name,email,password,mobile,address,category) values('${newUser.name}','${newUser.email}','${newUser.password}','${newUser.mobile}','${newUser.address}','${newUser.category}')`;
                console.log(sql_query);
                con.query(sql_query,function(err,result){
                  if (err) throw err;
                  console.log("Record Inserted  "+result);
                     res.json({
                       success:true,
                       msg:'User Created'
                     });
                   
                });  
              
          
       });
    });}
  });}
});

router.post('/login',function(req,res,next){
  let username=req.body.username;
  let password=req.body.password;
  
  req.checkBody('username', 'please enter a valid username').isEmail();
  req.checkBody('password', 'please enter a valid password').notEmpty();

  let errors=req.validationErrors();

  if (errors) res.json({error:errors});
  else{
  
      var sql_query=`select * from user_details where email='${username}'`;
        con.query(sql_query,function(err,result){
          if (err) throw err;
          console.log(result);
            if(result.length<=0) res.json({error:'no user with this username found'});
            else{
                bcrypt.compare(password,result[0].password,function(err,isMatch){
                    if (err) console.log(err);
                    else{
                      if(!isMatch) res.json({error:'Password does not match'});
                      else{
                            val=({id:result[0].id});
                            jwt.sign(val,secret,function(err,token){
                                if(err) console.log("jwt error:=> "+err);
                                else{
                                  res.json({
                                    msg:'Login Successful',
                                    token:token
                                  });
                                }
                            });
                      }
                    }
                });
            }
          
        });
      
  }
});


function isAuthenticated(req, res, next){
  if(req.headers['authorization']){
      jwt.verify(req.headers['authorization'], secret, function(err, decoded){
          if(err){
              console.log(err);
              res.json({error:err});
          }
          res.locals.userId = decoded.id;
          console.log("calling next now and " + res.locals.userId);
          return next();
      })
  }else{
      res.json({
          success:false,
          auth:false,
          msg:"authentication unsuccessful, please login again"
      });
  }
}


module.exports = router;
