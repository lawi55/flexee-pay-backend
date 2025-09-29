// utils/email-templates.js
const fs = require('fs');
const path = require('path');

const loadTemplate = async (templateName, data) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  let template = await fs.promises.readFile(templatePath, 'utf-8');
  
  // Replace placeholders
  Object.keys(data).forEach(key => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
  });
  
  return template;
};

module.exports = { loadTemplate };