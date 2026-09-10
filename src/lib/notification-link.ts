import type { Notification } from "@/types/notification";

export function getNotificationLink(notification: Notification): string {
  if (notification.type === "CV_FLIP_REQUEST") {
    return "/connections";
  }

  if (notification.type === "CV_FLIP_APPROVED" || notification.type === "CV_FLIP_REJECTED") {
    return "/candidates/cv-requests";
  }

  if (typeof notification?.metadata?.targetUrl === "string" && notification.metadata.targetUrl.startsWith("/")) {
    return notification.metadata.targetUrl;
  }

  if (notification.type === "APPLICATION_STATUS" && notification.metadata?.jobId) {
    return `/jobs/${notification.metadata.jobId}`;
  }

  if (notification.relatedEntityType === "TICKET" && notification.relatedEntityId) {
    const companySlug = notification.metadata?.companySlug;
    if (typeof companySlug === "string" && companySlug) {
      return `/tickets/${notification.relatedEntityId}?company=${companySlug}`;
    }
    return `/tickets/${notification.relatedEntityId}`;
  }

  return "#";
}
