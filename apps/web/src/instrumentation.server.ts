/**
 * SvelteKit instrumentation file – guaranteed to run before application code.
 *
 * Sets up the OpenTelemetry SDK so that SvelteKit's built-in tracing
 * (handle hooks, load functions, form actions, remote functions) emits
 * spans through the configured exporter.
 */
import { configureTelemetry } from "$lib/server/telemetry";

configureTelemetry();
