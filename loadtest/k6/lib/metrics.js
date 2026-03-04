/**
 * Custom k6 metrics for load test reporting.
 */
import { Rate, Trend } from 'k6/metrics';

export const errorRate = new Rate('errors');
export const discoverDuration = new Trend('discover_duration');
export const chatSendDuration = new Trend('chat_send_duration');
export const wsConnectDuration = new Trend('ws_connect_duration');
export const wsDeliveryRate = new Rate('ws_delivery_ok');
