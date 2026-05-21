import * as Sentry from "@sentry/nextjs";
import { getEdgeSentryOptions } from "@/lib/observability/sentry-config";

Sentry.init(getEdgeSentryOptions());
