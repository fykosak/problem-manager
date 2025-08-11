import { importUsers } from '@server/userAdapter/userImporter';

console.log('Starting user import');
importUsers();
console.log('User import finished');
