//Imports
const CONFIG = require('../config/config')
const path = require('path')
const ejs = require('ejs')
const { transporter } = require('./mail')
const { BlobServiceClient } = require('@azure/storage-blob');
const uuid = require('uuid');

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

const uploadBufferToAzureBlob = async (fileData, contentType) => {
  try {
    let storageAccountName, storageAccountKey, containerName, blobServiceClient,
      containerClient, blobName, blockBlobClient, blobContentType, blobUrl
    storageAccountName = CONFIG.ACCOUNTNAME;
    storageAccountKey = CONFIG.ACCOUNTKEY;
    containerName = CONFIG.CONTAINERNAME;

    blobServiceClient = BlobServiceClient.fromConnectionString(`DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccountKey};EndpointSuffix=core.windows.net`);

    containerClient = blobServiceClient.getContainerClient(containerName);

    blobName = `${uuid.v4()}${fileData.originalname}`;
    blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Determine content type
    blobContentType = contentType.startsWith('image/') ? 'image/png' : 'video/mp4';

    await blockBlobClient.uploadData(fileData.buffer, { blobHTTPHeaders: { blobContentType } });

    blobUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blobName}`;
    return blobUrl;
  } catch (error) {
    console.log(error.message);
  }
};

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

module.exports = {
  otpGenerate,
  errorMail,
  uploadBufferToAzureBlob
}