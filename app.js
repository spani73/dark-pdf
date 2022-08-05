const express = require('express');
var app = express();
var upload = require('express-fileupload');
var docxConverter = require('docx-pdf');
var path = require('path');
require('dotenv').config();
const fs = require('fs');
const AWS = require('aws-sdk');
const { resolve } = require('path');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY

});


const extend_pdf = '.pdf'
const extend_docx = '.pdf'

var down_name

app.use(upload());

 
app.get('/',function(req,res){
  res.sendFile(__dirname+'/index.html');
})
app.post('/upload',function(req,res){
  console.log(req.files);
  if(req.files.upfile){
    var file = req.files.upfile,
      name = file.name,
      type = file.mimetype;
    //File where .docx will be downloaded  

    var uploadpath = __dirname + '/uploads/' + "awsbktinput.pdf";
    
    //Name of the file --ex test,example
    const First_name = "awsbktinput";
    //Name to download the file
    down_name = "b";
    file.mv(uploadpath,function(err){
      if(err){
        console.log(err);
      }else{
        //Path of the downloaded or uploaded file
        var initialPath = path.join(__dirname, `./uploads/${First_name}${extend_docx}`);
        const uploadFileIntoS3 = () => {
          fs.readFile(initialPath , (err, data) => {
              if(err) throw err;
              filename = "awsbktinput.pdf";
              const params = {
                  Bucket: 'lambda-trigger-bckt',
                  Key: filename , 
                  ContentType: "application/pdf",
                  Body: data
              };
              s3.upload(params , function(s3Err , data){
                  if(s3Err) throw s3Err
                  console.log("uploaded successsfully at ->"  , data.Location);
                  var timerId = setInterval(function(){
                    const params = {
                      Bucket: 'output-pdfn8md-bucket',
                      Key: "result.pdf"
                    }; 
                    s3.headObject(params, function (err, metadata) {
                      if (err && err.name === 'NotFound') {  
                        // Handle no object on cloud here 
                        console.log("hii in a"); 
                      } else if (err) {
                        // Handle other errors here....
                        console.log(err);
                      } else {  
                        //console.log("hii in c");
                        res.sendFile(__dirname+'/down_html.html')
                        clearInterval(timerId);
                      }
                    });
                  }, 2000);
              });
          });
      };
        uploadFileIntoS3();
      }
    });
  }else{
    res.send("No File selected !");
    res.end();
  }
});

app.get('/download', async(req,res) =>{

  //This will be used to download the converted file
      const downloadFromS3 = async (key, location) => {
        const params = {
            Bucket: 'output-pdfn8md-bucket',
            Key: key,
        }
      
        const { Body } = await s3.getObject(params).promise()
        await fs.writeFile(location, Body , tobecalled)
      
        return true
      }
      await downloadFromS3('result.pdf' , './uploads/b.pdf');
      function tobecalled() {
      res.download(__dirname +`/uploads/${down_name}${extend_pdf}`,`${down_name}${extend_pdf}`,(err) =>{
      if(err){
        res.send(err);
      }else{
        //Delete the files from directory after the use
        console.log('Files deleted');
        const delete_path_doc = process.cwd() + `/uploads/${"awsbktinput"}${extend_docx}`;
        const delete_path_pdf = process.cwd() + `/uploads/${down_name}${extend_pdf}`;
        try {
          fs.unlinkSync(delete_path_doc)
          fs.unlinkSync(delete_path_pdf)
          //file removed
        } catch(err) {
        console.error(err)
        }
        
        const deleteFileFromS3 = () =>{
          const params1 = {
            Bucket: 'lambda-trigger-bckt',
            Key: "awsbktinput.pdf",
         } 

         const params2 = {
            Bucket: 'output-pdfn8md-bucket',
            Key :'result.pdf'
         }
          s3.deleteObject(params1 , function(err , data){
            if(err){
              console.log(err);
            }else{
              console.log("deleted file params1");
            }
          })

          s3.deleteObject(params2 , function(err , data){
            if(err){
              console.log(err);
            }else{
              console.log("deleted file params2");
            }
          })
        }
        deleteFileFromS3();
      }
    
    });
  }
})

app.get('/thankyou',(req,res) => {
    res.sendFile(__dirname+'/thankyou.html')
})

const port = process.env.PORT || '5000';  
app.listen(port,() => {
    console.log(`Server Started at port ${port}...`);
})




