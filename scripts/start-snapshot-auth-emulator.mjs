import { createRequire } from 'node:module';
const path=process.argv[2];
if(!path)throw Error('Caminho local do firebase-tools obrigatório');
// Carrega somente o servidor Auth já instalado: sem CLI, login ou descoberta remota.
const require=createRequire(import.meta.url);
process.stdout.write('Carregando servidor Auth local\n');
const {createApp}=require(path+'/lib/emulator/auth/server.js');
process.stdout.write('Criando Auth Emulator local\n');
const app=await createApp('demo-athena-question-import',2);
const server=app.listen(9099,'127.0.0.1');
server.on('listening',()=>process.stdout.write('Auth Emulator local pronto\n'));
const stop=()=>server.close(()=>process.exit(0));
process.on('SIGTERM',stop);process.on('SIGINT',stop);
