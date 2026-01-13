import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "../utils/api";
import toast from "react-hot-toast";

export const useProjects = (params = {}) =>
  useQuery({
    queryKey: ["projects", params],
    queryFn: async () => (await api.get(endpoints.projects, { params })).data
  });

export const useProjectStats = () =>
  useQuery({
    queryKey: ["projectStats"],
    queryFn: async () => (await api.get(endpoints.projectStats)).data,
    staleTime: 60_000
  });

export const useLeads = (params = {}) =>
  useQuery({
    queryKey: ["leads", params],
    queryFn: async () => (await api.get(endpoints.leads, { params })).data
  });

export const useLeadStats = () =>
  useQuery({
    queryKey: ["leadStats"],
    queryFn: async () => (await api.get(endpoints.leadStats)).data,
    staleTime: 60_000
  });

export const useEmployees = (params = {}) =>
  useQuery({
    queryKey: ["employees", params],
    queryFn: async () => (await api.get(endpoints.employees, { params })).data
  });

export const useEmployeeStats = () =>
  useQuery({
    queryKey: ["employeeStats"],
    queryFn: async () => (await api.get(endpoints.employeeStats)).data,
    staleTime: 60_000
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post(endpoints.projects, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projectStats"] });
      toast.success("Project created");
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to create")
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) =>
      (await api.put(`${endpoints.projects}/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projectStats"] });
      toast.success("Project updated");
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to update")
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`${endpoints.projects}/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projectStats"] });
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to delete")
  });
};
