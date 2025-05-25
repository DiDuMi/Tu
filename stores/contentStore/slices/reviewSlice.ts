/**
 * 审核反馈状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState, ReviewFeedback } from '../types'

// 创建审核反馈状态切片
export const createReviewSlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'reviewFeedbacks'
    | 'totalFeedbacks'
    | 'feedbacksCurrentPage'
    | 'feedbacksPageSize'
    | 'feedbacksIsLoading'
    | 'setReviewFeedbacks'
    | 'setTotalFeedbacks'
    | 'setFeedbacksCurrentPage'
    | 'setFeedbacksPageSize'
    | 'setFeedbacksIsLoading'
  >
> = (set) => ({
  // 审核反馈状态
  reviewFeedbacks: [],
  totalFeedbacks: 0,
  feedbacksCurrentPage: 1,
  feedbacksPageSize: 10,
  feedbacksIsLoading: false,
  
  // 审核反馈操作
  setReviewFeedbacks: (reviewFeedbacks: ReviewFeedback[]) => set({ reviewFeedbacks }),
  setTotalFeedbacks: (totalFeedbacks: number) => set({ totalFeedbacks }),
  setFeedbacksCurrentPage: (feedbacksCurrentPage: number) => set({ feedbacksCurrentPage }),
  setFeedbacksPageSize: (feedbacksPageSize: number) => set({ feedbacksPageSize }),
  setFeedbacksIsLoading: (feedbacksIsLoading: boolean) => set({ feedbacksIsLoading }),
})
