import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
	route(":contest/:year", "routes/layout.tsx", [
		layout("routes/contestLayout.tsx", [
			index("routes/home.tsx"),
			route("tasks", "routes/tasks.tsx"),
			route("task-suggestions", "routes/taskSuggestions.tsx"),
		]),
		route("task/:taskId", "routes/task.tsx", [
			index("routes/task.edit.tsx"),
			route("work", "routes/task.work.tsx"),
			route("metadata", "routes/task.metadata.tsx")
		])
	])
] satisfies RouteConfig;
