import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from '@react-router/dev/routes';

export default [
	route('/login', 'routes/login.tsx'),
	layout('routes/authed.layout.tsx', [
		layout('routes/base.layout.tsx', [
			index('routes/index.tsx'),
			route('/user/api-keys', 'routes/user.apiKeys.tsx'),
			route('/create-problem', 'routes/base.createProblem.tsx'),
			...prefix('/how-to', [
				index('routes/howTo.main.tsx'),
				route('/:markdownFile', 'routes/howTo.file.tsx'),
			]),
			route('/admin', 'routes/base.admin.tsx'),
		]),
		route(':contest/:year', 'routes/contest.layout.tsx', [
			layout('routes/contest.main.layout.tsx', [
				index('routes/contest.tasks.tsx'),
				...prefix('tasks', [
					route('ordering', 'routes/contest.tasks.ordering.tsx'),
					route(
						'suggestions',
						'routes/contest.tasks.suggestions.tsx'
					),
					route('create', 'routes/contest.tasks.create.tsx'),
				]),
				...prefix('series', [
					route('create', 'routes/contest.series.create.tsx'),
					route(':seriesId/edit', 'routes/contest.series.edit.tsx'),
				]),
			]),
			route('task/:taskId', 'routes/task.layout.tsx', [
				index('routes/task.edit.tsx'),
				route('work', 'routes/task.work.tsx'),
				route('metadata', 'routes/task.metadata.tsx'),
				route('files', 'routes/task.files.tsx'),
				route('web-texts', 'routes/task.webTexts.tsx'),
			]),
		]),
	]),
] satisfies RouteConfig;
