import express from 'express';
import { TaskBuilder } from './taskBuilder';
const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.post('/build', async (req, res) => {
	const builder = new TaskBuilder(req.body.path);
	const log = await builder.build(req.body.file);

	console.log(req.body);
	res.send(log);
});

app.listen(8080, () => {
	console.log(`Builder running`);
});
