import * as Sentry from "@sentry/nextjs";
import { getClientSentryOptions } from "@/lib/observability/sentry-config";

Sentry.init(getClientSentryOptions());
