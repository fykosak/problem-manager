import { eq } from "drizzle-orm";
import { db } from ".";
import * as schema from "./schema";

async function seed() {

	console.log("Init contest");
	await db.insert(schema.contestTable).values(
		[
			{ contestId: 1, name: 'FYKOS' },
			{ contestId: 2, name: 'Fyziklání' },
			{ contestId: 3, name: 'Fyziklání Online' },
			{ contestId: 4, name: 'Výfuk' },
		]
	);

	console.log("Init contest years");
	await db.insert(schema.contestYearTable).values([
		{ contestYearId: 1, contestId: 1, year: 35 },
		{ contestYearId: 2, contestId: 1, year: 36 },
		{ contestYearId: 3, contestId: 1, year: 37 },
		{ contestYearId: 4, contestId: 1, year: 38 },
		{ contestYearId: 5, contestId: 2, year: 13 },
		{ contestYearId: 6, contestId: 2, year: 14 },
		{ contestYearId: 7, contestId: 2, year: 15 },
		{ contestYearId: 8, contestId: 3, year: 13 },
		{ contestYearId: 9, contestId: 3, year: 14 },
		{ contestYearId: 10, contestId: 3, year: 15 },
		{ contestYearId: 11, contestId: 4, year: 10 },
		{ contestYearId: 12, contestId: 4, year: 11 },
		{ contestYearId: 13, contestId: 4, year: 12 },
		{ contestYearId: 14, contestId: 4, year: 13 },
		{ contestYearId: 15, contestId: 4, year: 14 }
	]);

	console.log("Init series");
	for (let i = 1; i <= 6; i++) {
		await db.insert(schema.seriesTable).values([
			{ contestYearId: 1, label: i.toString() },
			{ contestYearId: 2, label: i.toString() },
			{ contestYearId: 3, label: i.toString() },
			{ contestYearId: 4, label: i.toString() },
			{ contestYearId: 11, label: i.toString() },
			{ contestYearId: 12, label: i.toString() },
			{ contestYearId: 13, label: i.toString() },
			{ contestYearId: 14, label: i.toString() },
			{ contestYearId: 15, label: i.toString() }
		]);
	}

	for (let i = 1; i <= 4; i++) {
		await db.insert(schema.seriesTable).values([
			{ contestYearId: 8, label: i.toString() },
			{ contestYearId: 9, label: i.toString() },
			{ contestYearId: 10, label: i.toString() },
		]);
	}

	await db.insert(schema.seriesTable).values([
		{ contestYearId: 8, label: 'main' },
		{ contestYearId: 9, label: 'main' },
		{ contestYearId: 10, label: 'main' },
	]);

	console.log("Init topics");
	for (let i = 1; i <= 4; i++) {
		await db.insert(schema.topicTable).values([
			{ contestId: i, label: "Kinematika" },
			{ contestId: i, label: "Dynamika" },
			{ contestId: i, label: "Hydromechanika" },
			{ contestId: i, label: "Matematika" },
			{ contestId: i, label: "Energie" },
			{ contestId: i, label: "Gravitační pole" },
			{ contestId: i, label: "Astronomie" },
			{ contestId: i, label: "Optika" },
			{ contestId: i, label: "Elektřina" },
		]);
	}

	console.log("Init person");
	for (let i = 1; i <= 20; i++) {
		let firstName = ["James", "Michael", "Robert", "John", "Mary", "Betty"][Math.floor(Math.random() * 6)];
		let lastName = ["Elsher", "Solace", "Raven", "Ashley", "West", "Adler"][Math.floor(Math.random() * 6)];
		await db.insert(schema.personTable).values({
			personId: i,
			firstName: firstName,
			lastName: lastName,
			texSignature: (firstName + lastName).toLowerCase()
		})
	}

	console.log("Init problems");
	for (let i = 1; i <= 4; i++) {
		const availableTopics = Array.from(await db.query.topicTable.findMany({
			where: eq(schema.topicTable.contestId, i)
		}), (topic) => topic.topicId);
		for (let i = 0; i < 50; i++) {
			const name = ["Lorem ipsum", "Dolor sit amet", "consectetur adipiscing", "Cras eu", "nisl justo"][Math.floor(Math.random() * 5)]
			const [problem] = await db.insert(schema.problemTable).values({
				state: Math.random() < 0.8 ? 'active' : 'deleted',
				metadata: {
					name: {
						cs: name,
						en: name
					}
				},
			}).returning();

			// topics
			const shuffledTopics = availableTopics;
			const selectedTopics = shuffledTopics.sort(() => 0.5 - Math.random()).slice(0, Math.floor(1 + Math.random() * Math.min(availableTopics.length, 4)));
			await db.insert(schema.problemTopicTable).values(Array.from(selectedTopics, (topicId) => ({
				problemId: problem.problemId,
				topicId: topicId,
			})));

			// texts
			for (const lang of ['cs', 'en']) {
				for (const type of ['task', 'solution']) {
					const [text] = await db.insert(schema.textTable).values({
						// @ts-ignore
						problemId: problem.problemId,
						lang: lang,
						type: type
					}).returning();
					await db.insert(schema.textContestTable).values({
						textId: text.textId,
						contents: "Lorem ipsum dolor sit amet",
						personId: 1 + Math.floor(Math.random() * 20)
					})
				}
			}

			// authors
			await db.insert(schema.authorTable).values([
				{
					personId: 1 + Math.floor(Math.random() * 20),
					problemId: problem.problemId,
					type: 'task'
				}, {
					personId: 1 + Math.floor(Math.random() * 20),
					problemId: problem.problemId,
					type: 'solution'
				}
			])

			// add works
			await db.insert(schema.workTable).values([{
				problemId: problem.problemId,
				group: 'Zadání',
				label: 'Odborná korektura zadání'
			}, {
				problemId: problem.problemId,
				group: 'Zadání',
				label: 'Jazyková korektura zadání'
			}, {
				problemId: problem.problemId,
				group: 'Řešení',
				label: 'Odborná korektura řešení'
			}, {
				problemId: problem.problemId,
				group: 'Řešení',
				label: 'Jazyková korektura řešení'
			}])
		}
	}

	console.log("Fill person work");
	const works = Array.from(await db.select().from(schema.workTable), (work) => work.workId);
	for (let workId of works) {
		await db.insert(schema.personWorkTable).values({
			personId: 1 + Math.floor(Math.random() * 20),
			workId: workId
		})
	}

	console.log("Seeding finished");
}

seed();
