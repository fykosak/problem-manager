import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
	layout("routes/layout.tsx", [
		index("routes/home.tsx"),
		route("tasks", "routes/tasks.tsx"),
		route("task-suggestions", "routes/taskSuggestions.tsx"),
		route("tasks/edit", "routes/tasks.edit.tsx"),
	])
] satisfies RouteConfig;
