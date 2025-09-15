import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import { resolve } from "path";

export default defineConfig({
	plugins: [
		react(),
		topLevelAwait({
			// The export name of top-level await promise for each chunk module
			promiseExportName: "__tla",
			// The function to generate import names of top-level await promise in each chunk module
			promiseImportName: (i) => `__tla_${i}`,
		}),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	root: ".",
	build: {
		outDir: "dist",
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunks
					"react-vendor": ["react", "react-dom"],
					"router-vendor": ["react-router-dom"],
					"redux-vendor": [
						"@reduxjs/toolkit",
						"react-redux",
						"redux-persist",
					],

					// UI library chunks
					"ui-vendor": [
						"class-variance-authority",
						"clsx",
						"tailwind-merge",
					],

					// HTTP client
					"http-vendor": ["axios"],
				},
			},
		},
		// Increase chunk size warning limit to 600KB (optional)
		chunkSizeWarningLimit: 600,
		// Enable source maps for better debugging (optional)
		sourcemap: false,
	},
	server: {
		host: "0.0.0.0",
		port: 5173,
		open: false,
		allowedHosts: [
			"localhost",
			"cogniflow.bharatbhusal.com",
			"backend-cogniflow.bharatbhusal.com",
		],
	},
});
