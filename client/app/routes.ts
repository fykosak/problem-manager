import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
	route(":contest/:year", "routes/layout.tsx", [
		index("routes/home.tsx"),
		route("tasks", "routes/tasks.tsx"),
		route("task-suggestions", "routes/taskSuggestions.tsx"),
		route("tasks/edit", "routes/tasks.edit.tsx"),
		route("task/:taskId", "routes/task.tsx", [
			index("routes/task.index.tsx"),
			route("work", "routes/task.work.tsx"),
			route("metadata", "routes/task.metadata.tsx")
		])
	])
] satisfies RouteConfig;
