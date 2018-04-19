/** 服务器api相关 */

const debug = false;
var domain;


//domainName 后面拼接的接口名
function obtainUrl(url){
  if(!debug){
    domain = 'https://traffic.benpaobao.com/';
  }else{
    domain = 'http://192.168.1.114:8000/';
  }
  console.log('domain---------->' + domain);
  return domain + url;
}

const loginUrl = 'app/user/wx_login';
const uploadInfoUrl = 'app/user/upload_info';
const queryInfoUrl = 'app/user/query_info';

module.exports = {
  obtainUrl: obtainUrl,
  loginUrl: loginUrl,
  uploadInfoUrl: uploadInfoUrl,
  queryInfoUrl: queryInfoUrl,
}