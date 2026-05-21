import * as Sentry from "@sentry/nextjs";
import { getServerSentryOptions } from "@/lib/observability/sentry-config";

Sentry.init(getServerSentryOptions());
