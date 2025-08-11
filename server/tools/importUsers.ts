import { importUsers } from '@server/userAdapter/userImporter';

console.log('Starting user import');
await importUsers();
console.log('User import finished');
