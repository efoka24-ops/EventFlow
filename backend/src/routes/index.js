import { Router } from "express";
import authRoutes from "./auth.js";
import eventsRoutes from "./events.js";
import registrationsRoutes from "./registrations.js";
import helpArticlesRoutes from "./helpArticles.js";
import eventFeedbackRoutes from "./eventFeedback.js";
import userActionsRoutes from "./userActions.js";
import siteSessionsRoutes from "./siteSessions.js";
import paymentsRoutes from "./payments.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/events", eventsRoutes);
apiRouter.use("/registrations", registrationsRoutes);
apiRouter.use("/help-articles", helpArticlesRoutes);
apiRouter.use("/event-feedback", eventFeedbackRoutes);
apiRouter.use("/user-actions", userActionsRoutes);
apiRouter.use("/site-sessions", siteSessionsRoutes);
apiRouter.use("/payments", paymentsRoutes);
