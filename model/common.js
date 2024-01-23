//Imports
const db = require('../model/mongodb')
const { ShareServiceClient } = require("@azure/storage-file-share")
const fs = require('fs').promises
const CONFIG = require('../config/config')
let CONFIGJSON = require('../config/config.json')
// const jwt = require('jsonwebtoken')
const path = require('path')
// const { ObjectId } = require('bson')
// const ejs = require('ejs')
// const { transporter } = require('./mail')


// //convert the reading file to base64

// function getImageAsBase64(imagePath) {
//   try {
//     const imageBuffer = fsRead.readFileSync(imagePath);
//     const imageBase64 = imageBuffer.toString('base64');
//     const imageExtension = imagePath.split('.').pop();
//     return `data:image/${imageExtension};base64,${imageBase64}`;
//   } catch (error) {
//     console.log(`Error in common/getImageAsBase64 - ${error.message}`)
//   }
// }

// //Forgot Password Mail
// const forgotPasswordMail = async (mailData) => {
//   let errorData, mailOptions
//   try {
//     errorData = { location: "Forgot password", funName: "forgotPasswordMail" }

//     ejs.renderFile("./templates/user/forgotPassword.ejs",
//       {
//         fullName: mailData.fullName,
//         email: mailData.emailTo,
//         url: mailData.url,
//         linkdinUrl: mailData.linkdinUrl,
//         instaUrl: mailData.instaUrl,
//         otp: mailData.otp,
//         logoUrl: getImageAsBase64(imagePath)
//       }
//       , async (err, data) => {
//         if (err) {
//           console.log(err);
//           await common.errorMail(errorData)
//         } else {
//           mailOptions = {
//             from: process.env.SMTP_AUTH_USER,
//             to: mailData.emailTo,
//             subject: `AllMasters | Attention! Password Reset Request`,
//             html: data
//           }

//           //Send Mail
//           transporter.sendMail(mailOptions, async (error, info) => {
//             if (error) {
//               if (mailResendAttempts !== 0) {
//                 forgotPasswordMail(mailData)
//                 mailResendAttempts--
//               } else {
//                 mailResendAttempts = 2
//                 await common.errorMail(errorData)
//               }
//               console.log(`Mail Not Sent - ${error}`)
//               return console.log(error)
//             }
//             console.log(`Mail sent:  - ${info.messageId}`)
//           })
//         }
//       })
//   } catch (error) {
//     console.log(`Error sending common/forgotPasswordMail - ${error.message}`)
//   }
// }

const errorMail = async (errorData) => {
  let templatePathUser, errorMailTo, mailOptions
  try {
    templatePathUser = path.resolve('./templates')
    errorMailTo = JSON.parse(process.env.errorMailTo)

    ejs.renderFile(`${templatePathUser}/errorHandler.ejs`,
      {
        location: errorData.location,
        funName: errorData.funName,
        logoUrl: getImageAsBase64(imagePath)
      }
      , (err, data) => {
        if (err) {
          console.log(err);
        } else {
          mailOptions = {
            from: process.env.SMTP_AUTH_USER,
            to: errorMailTo,
            subject: `Attention | Error while sending mail`,
            html: data
          }
          //Send Mail
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(`Error catching mail not sent: - ${error}`)
              return console.log(error)
            }
            console.log(`Error catching mail sent:  - ${info.messageId}`)
          })
        }
      })
  } catch (error) {
    console.log(`Error sending common/errorMail - ${error.message}`)
  }
}

async function deleteFilesInFolder(filePath, folderName) {
  try {
    const shareServiceClient = ShareServiceClient.fromConnectionString(CONFIG.AZURECONNECTIONSTRING);
    const shareName = CONFIGJSON.azureFilePath.shareName
    const shareClient = shareServiceClient.getShareClient(shareName);
    const shareExists = await shareClient.exists()

    if (shareExists) {

      if (filePath === 'posts') {

        directoryName = CONFIGJSON.azureFilePath.directory + `/posts/${folderName}`
      }

      const directoryClient = shareClient.getDirectoryClient(directoryName);

      const files = directoryClient.listFilesAndDirectories();
      for await (const file of files) {
        if (file.kind === "file") {
          await directoryClient.getFileClient(file.name).deleteIfExists();
        }
      }
    }
  } catch (error) {
    console.log('Error in Azure File deleteFilesInFolder: ' + error.message + '')
  }
}

//Azure File Share Upload - uploadFileAzure(filePath, lclbookingId, fileNamePath)
const uploadFileAzure = async (filePath, folderName, fileData) => {
  let serviceClient, shareName, shareClient, shareExists,
    fileHierarchyPath, fileHierarchy, directoryName, directoryClient, directoryExists,
    fileName, fileClient, directoryFolderExists, directoryFolder, fileDirectory, bufferWithData

  const azureConnectionString = CONFIG.AZURECONNECTIONSTRING
  if (!azureConnectionString) throw Error('Azure Storage ConnectionString not found');

  try {
    serviceClient = ShareServiceClient.fromConnectionString(azureConnectionString)

    //Azure File Share
    shareName = CONFIGJSON.azureFilePath.shareName
    shareClient = serviceClient.getShareClient(shareName);
    shareExists = await shareClient.exists()
    // await shareClient.create();           -    To Create Azure Share Client if not exists. Legacy Now as Azure Share Client Already Exists

    if (shareExists) {
      //Finding the File Hierarchy to determine the Directory Name to Upload the File in Azure File Share

      //Azure File Share Directory
      if (filePath === 'posts') {
        fileDirectory = CONFIGJSON.azureFilePath.directory + '/posts'
        directoryFolder = shareClient.getDirectoryClient(fileDirectory)
        directoryFolderExists = await directoryFolder.exists()
        if (!directoryFolderExists) { await directoryFolder.create() }

        directoryName = CONFIGJSON.azureFilePath.directory + `/posts/${folderName}`
      }
      directoryClient = shareClient.getDirectoryClient(directoryName)
      directoryExists = await directoryClient.exists()
      if (!directoryExists) { await directoryClient.create() }

      //Azure File Share File
      fileName = fileData.originalname
      fileClient = directoryClient.getFileClient(fileName)
      bufferWithData = Buffer.from(fileData.buffer);
      await fileClient.uploadData(bufferWithData, bufferWithData.length, { overwrite: true })
    }
  }
  catch (error) {
    console.log('Error in Azure File uploadFileAzure: ' + error.message + '')
  }
}

const getImageFromShare = async ( filePath) => {
  const connectionString = CONFIG.AZURECONNECTIONSTRING
  if (!connectionString) throw Error('Azure Storage ConnectionString not found');

  shareName = CONFIGJSON.azureFilePath.shareName

  const shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
  const shareClient = shareServiceClient.getShareClient(shareName);
  const directoryClient = shareClient.getDirectoryClient(filePath);

  const fileClient = directoryClient.getFileClient('image.png');

  const downloadFileResponse = await fileClient.download();
  const imageBuffer = await streamToBuffer(downloadFileResponse.readableStreamBody);

  return imageBuffer;
}


// //Azure File Share Download - downloadFileAzure(lclbookingId)
// const downloadFileAzure = async (folderName, fileToDownload, type) => {
//   let serviceClient, shareName, shareClient, shareExists,
//     directoryName, directoryClient, directoryExists,
//     fileName, fileClient, fileUploadsPath, filePath,
//     fileDownloadBuffer, allfiles = []

//   fileUploadsPath = path.resolve(__dirname, '../fileuploads')
//   filePath = `${fileUploadsPath}/${type}/${folderName}/`
//   await fs.mkdir(filePath, { recursive: true }, (err) => {
//     if (err) throw err;
//   })

//   const azureConnectionString = CONFIG.AZURECONNECTIONSTRING
//   if (!azureConnectionString) throw Error('Azure Storage ConnectionString not found');

//   try {
//     serviceClient = ShareServiceClient.fromConnectionString(azureConnectionString)

//     //Azure File Share
//     shareName = CONFIGJSON.azureFilePath.shareName
//     shareClient = serviceClient.getShareClient(shareName);
//     shareExists = await shareClient.exists()
//     // await shareClient.create();

//     //Azure File Share Directory
//     if (shareExists) {
//       directoryName = CONFIGJSON.azureFilePath.directory + `/${type}/${folderName}`
//       directoryClient = shareClient.getDirectoryClient(directoryName)
//       directoryExists = await directoryClient.exists()

//       if (directoryExists) {
//         const dirIter = directoryClient.listFilesAndDirectories()
//         let i = 1;
//         for await (const item of dirIter) {
//           if (item.kind === "directory") {
//             console.log(`${i} - directory\t: ${item.name}`);
//           } else {
//             //Azure File Share File Download to Server
//             // console.log(`${i} - file\t: ${item.name}`);
//             if (fileToDownload !== "") {
//               if (fileToDownload === item.name) {
//                 fileName = item.name
//                 fileClient = directoryClient.getFileClient(fileName)
//                 fileDownloadBuffer = await fileClient.downloadToBuffer()

//                 return "data:application/pdf;base64," + Buffer.from(fileDownloadBuffer).toString('base64')
//               }

//             }
//             else {
//               fileName = item.name
//               fileClient = directoryClient.getFileClient(fileName)
//               fileDownloadBuffer = await fileClient.downloadToBuffer()
//               allfiles.push({ fileName, filePath: "data:application/pdf;base64," + Buffer.from(fileDownloadBuffer).toString('base64') })
//             }
//           }
//           i++;
//         }
//         return allfiles
//       }
//     }
//   }
//   catch (error) {
//     console.log('Error in Azure File downloadFileAzure: ' + error.message + '');
//     data.response = error.message;
//     res.send(data);
//   }
// }

// //Create Milestone Directory - createDir(fileuploadpath)
// const createDir = async (path) => {
//   await fs.mkdir(path, { recursive: true }, (err) => {
//     if (err) throw err;
//   });
// }

// //Create Milestone File - createMilestoneFile(`${filePath}/${lclbookingId}/${fileName}`, base64Pdf, 'base64')
// const createFile = async (filePath, fileData, fileEncoding) => {
//   try {
//     await fs.writeFile(filePath, fileData, { encoding: fileEncoding })
//   } catch (error) {
//     console.log('Error in createFile ' + error.message + '');
//   }
// }

const otpGenerate = () => {
  try {
    let otp = Math.random().toString().substring(2, 8)
    if (otp.length !== 6) {
      otpGenerate()
    } else {
      return otp
    }
  } catch (error) {
    console.log('Error in common/otpGenerate' + error.message + '');
  }
}

// const checkAccess = function (role) {
//   return async (req, res, next) => {
//     try {
//       let token, privateKey, verifyAccessToken
//       if (req.headers.authorization && req.headers.authorization !== '' && req.headers.authorization !== null) {
//         token = req.headers.authorization
//         token = token.substring(7)
//       }
//       privateKey = await fs.readFile('privateKey.key', 'utf8');
//       if (!token) {

//         return res.status(401).send("Unauthorized Access")
//       }

//       try {

//         verifyAccessToken = jwt.verify(token, privateKey, { algorithms: ["RS256"] })

//       } catch (error) {
//         return res.status(401).send("Unauthorized Access")
//       }
//       if (role.includes(verifyAccessToken.role) === false) {

//         return res.status(401).send("Unauthorized Access")
//       }
//       next();
//     }
//     catch (error) {
//       next(error)
//     }
//   }
// }

module.exports = {
  uploadFileAzure,
  // downloadFileAzure,
  // createDir,
  // createFile,
  otpGenerate,
  // checkAccess,
  // deleteFilesInFolder,
  // getImageAsBase64,
  errorMail
}