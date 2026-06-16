import { createClient } from "@/lib/supabase/client"

export class CrossAppSyncService {
  private supabase = createClient()

  /**
   * When a contractor posts a job, notify all workers in real-time
   * Workers see the job instantly in their job feed
   */
  async notifyWorkersOfNewJob(jobId: string, contractorName: string, jobTitle: string) {
    try {
      const { data: workers } = await this.supabase.from("profiles").select("id").eq("user_type", "worker")

      if (workers && workers.length > 0) {
        const notifications = workers.map((worker) => ({
          user_id: worker.id,
          type: "new_job",
          title: "New Job Available",
          message: `${contractorName} posted a new job: ${jobTitle}`,
          is_read: false,
        }))

        await this.supabase.from("notifications").insert(notifications)
      }
    } catch (error) {
      console.error("Error notifying workers of new job:", error)
    }
  }

  /**
   * When a worker applies for a job, notify the contractor in real-time
   * Contractor sees the application instantly in their applications list
   */
  async notifyContractorOfApplication(
    contractorId: string,
    workerName: string,
    jobTitle: string,
    applicationId: string,
  ) {
    try {
      await this.supabase.from("notifications").insert({
        user_id: contractorId,
        type: "new_application",
        title: "New Application",
        message: `${workerName} applied for: ${jobTitle}`,
        is_read: false,
      })
    } catch (error) {
      console.error("Error notifying contractor of application:", error)
    }
  }

  /**
   * When a contractor accepts an application, notify the worker in real-time
   * Worker sees their application status change instantly
   */
  async notifyWorkerOfAcceptance(workerId: string, contractorName: string, jobTitle: string) {
    try {
      await this.supabase.from("notifications").insert({
        user_id: workerId,
        type: "application_accepted",
        title: "Application Accepted",
        message: `${contractorName} accepted your application for: ${jobTitle}`,
        is_read: false,
      })
    } catch (error) {
      console.error("Error notifying worker of acceptance:", error)
    }
  }

  /**
   * When a contractor posts a Tatkal job, notify all workers urgently
   * Workers see urgent jobs with countdown timer in real-time
   */
  async notifyWorkersOfTatkalJob(jobId: string, contractorName: string, jobTitle: string, urgencyLevel: string) {
    try {
      const { data: workers } = await this.supabase.from("profiles").select("id").eq("user_type", "worker")

      if (workers && workers.length > 0) {
        const notifications = workers.map((worker) => ({
          user_id: worker.id,
          type: "tatkal_job",
          title: `URGENT: ${urgencyLevel} Priority Job`,
          message: `${contractorName} posted an urgent job: ${jobTitle}. Limited time to grab!`,
          is_read: false,
        }))

        await this.supabase.from("notifications").insert(notifications)
      }
    } catch (error) {
      console.error("Error notifying workers of Tatkal job:", error)
    }
  }

  /**
   * When a worker is marked as no-show, apply penalty and notify in real-time
   * Worker sees penalty points updated instantly
   */
  async applyPenaltyAndNotify(workerId: string, penaltyPoints: number, reason: string) {
    try {
      // Update penalty points
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("penalty_points")
        .eq("id", workerId)
        .single()

      const newPenaltyPoints = (profile?.penalty_points || 0) + penaltyPoints

      await this.supabase.from("profiles").update({ penalty_points: newPenaltyPoints }).eq("id", workerId)

      // Notify worker
      await this.supabase.from("notifications").insert({
        user_id: workerId,
        type: "penalty",
        title: "Penalty Applied",
        message: `${penaltyPoints} penalty points added. Reason: ${reason}. Total: ${newPenaltyPoints}`,
        is_read: false,
      })
    } catch (error) {
      console.error("Error applying penalty:", error)
    }
  }

  /**
   * Subscribe to cross-app events for real-time synchronization
   */
  subscribeToJobApplications(callback: (data: any) => void) {
    return this.supabase
      .channel("cross_app_applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, (payload) => {
        callback(payload)
      })
      .subscribe()
  }

  subscribeToJobUpdates(callback: (data: any) => void) {
    return this.supabase
      .channel("cross_app_jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        callback(payload)
      })
      .subscribe()
  }
}
