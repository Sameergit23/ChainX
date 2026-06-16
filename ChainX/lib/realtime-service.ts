import { createClient } from "@/lib/supabase/client"

export class RealtimeService {
  private supabase = createClient()

  // Subscribe to job updates - contractors post jobs, workers see them in real-time
  subscribeToJobUpdates(callback: (job: any) => void) {
    return this.supabase
      .channel("jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        callback(payload.new)
      })
      .subscribe()
  }

  // Subscribe to application updates - workers apply, contractors see in real-time
  subscribeToApplicationUpdates(callback: (app: any) => void) {
    return this.supabase
      .channel("job_applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, (payload) => {
        callback(payload.new)
      })
      .subscribe()
  }

  // Subscribe to notifications - real-time alerts for both apps
  subscribeToNotifications(userId: string, callback: (notif: any) => void) {
    return this.supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          callback(payload.new)
        },
      )
      .subscribe()
  }

  // Subscribe to penalties - workers see penalties in real-time
  subscribeToPenalties(userId: string, callback: (penalty: any) => void) {
    return this.supabase
      .channel(`penalties:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "penalties", filter: `worker_id=eq.${userId}` },
        (payload) => {
          callback(payload.new)
        },
      )
      .subscribe()
  }

  // Subscribe to profile updates - penalty points sync across apps
  subscribeToPenaltyUpdates(callback: (profile: any) => void) {
    return this.supabase
      .channel("profiles")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        callback(payload.new)
      })
      .subscribe()
  }

  subscribeToTatkalJobs(callback: (job: any) => void) {
    return this.supabase
      .channel("tatkal_jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "tatkal_jobs" }, (payload) => {
        callback(payload.new)
      })
      .subscribe()
  }

  subscribeToJobStatusChanges(jobId: string, callback: (job: any) => void) {
    return this.supabase
      .channel(`job:${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          callback(payload.new)
        },
      )
      .subscribe()
  }

  subscribeToApplicationStatusChanges(applicationId: string, callback: (app: any) => void) {
    return this.supabase
      .channel(`application:${applicationId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "job_applications", filter: `id=eq.${applicationId}` },
        (payload) => {
          callback(payload.new)
        },
      )
      .subscribe()
  }
}
