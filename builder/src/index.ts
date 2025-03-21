import express from 'express';

import getExporter from './exporters/getExporter';
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

app.post('/export', async (req, res) => {
	console.log('export file');
	const filepath = req.body.filepath;
	if (!filepath) {
		res.status(400).send({ message: 'Filepath not provided' });
		return;
	}
	if (typeof filepath !== 'string') {
		res.status(400).send({ message: 'Filepath must be a string' });
		return;
	}

	const targetDirectory = req.body.targetDirectory;
	if (!targetDirectory) {
		res.status(400).send({ message: 'Target directory not provided' });
		return;
	}
	if (typeof targetDirectory !== 'string') {
		res.status(400).send({ message: 'Target directory must be a string' });
		return;
	}

	try {
		getExporter(filepath, targetDirectory).export();
		res.sendStatus(200);
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).send({
				message: error.message,
			});
		}
	}
});

app.listen(8080, () => {
	console.log(`Builder running`);
});
