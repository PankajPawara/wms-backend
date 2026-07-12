const bcrypt = require('bcryptjs');
bcrypt.compare('Admin@1234', '$2a$12$q/d8hfDaOkkeZTZP8vICCuQJc97AQBs5EY0CNn1mZsOXHnS1zKWW.').then(console.log);
bcrypt.compare('Pass@1234', '$2a$12$vxtIvr9C00YjUycoLgUUfO0DnnO.MYyjrRIKMvppV8Jg9q67EBxR.').then(console.log);
