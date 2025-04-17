const csv = require('csvtojson');
const xlsx = require('xlsx');
const fs = require('fs');

exports.parseFile = async (filePath) => {
  if (filePath.endsWith('.csv')) {
    return await csv().fromFile(filePath);
  } else {
    const wb = xlsx.readFile(filePath);
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    fs.unlinkSync(filePath);
    return data;
  }
};