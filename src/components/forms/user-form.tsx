"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser } from "@/actions/user";
import { getDivisions } from "@/actions/division";

type User = {
  id?: string;
  email: string;
  name: string;
  nameLocal?: string | null;
  role: string;
  divisionId: string;
  isActive: boolean;
};

type Division = {
  id: string;
  nameLocal: string;
};

type UserFormProps = {
  user?: User;
  locale: string;
};

export default function UserForm({ user, locale }: UserFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    name: user?.name || "",
    nameLocal: user?.nameLocal || "",
    password: "",
    confirmPassword: "",
    role: user?.role || "STAFF",
    divisionId: user?.divisionId || "",
    isActive: user?.isActive ?? true,
  });

  useEffect(() => {
    setIsMounted(true);
    async function fetchDivisions() {
      const result = await getDivisions();
      if (result.success && result.data) {
        setDivisions(result.data);
      }
    }
    fetchDivisions();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate password confirmation
      if (!user && !formData.password) {
        setError("Password is required for new users");
        setIsLoading(false);
        return;
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      const data: {
        email: string;
        name: string;
        nameLocal?: string;
        role: "SUPER_ADMIN" | "ADMIN" | "APPROVER" | "STAFF" | "VIEWER";
        divisionId: string;
        isActive: boolean;
        password?: string;
      } = {
        email: formData.email,
        name: formData.nameLocal || formData.name,
        nameLocal: formData.nameLocal || undefined,
        role: formData.role as
          | "SUPER_ADMIN"
          | "ADMIN"
          | "APPROVER"
          | "STAFF"
          | "VIEWER",
        divisionId: formData.divisionId,
        isActive: formData.isActive,
      };

      // Only include password if it's provided
      if (formData.password) {
        data.password = formData.password;
      }

      const result = user?.id
        ? await updateUser(user.id, data)
        : await createUser(data);

      if (result.success) {
        router.push(`/${locale}/dashboard/users`);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      // console.error("User form error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {user?.id ? t("users.edit") : t("users.create")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("users.email")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Name Local */}
            <div className="space-y-2">
              <Label htmlFor="nameLocal">{t("users.name")} <span className="text-destructive">*</span></Label>
              <Input
                id="nameLocal"
                value={formData.nameLocal}
                onChange={(e) => handleChange("nameLocal", e.target.value)}
                placeholder="ชื่อภาษาไทย"
                disabled={isLoading}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                {t("users.role")} <span className="text-destructive">*</span>
              </Label>
              {isMounted ? (
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="APPROVER">Approver</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
            </div>

            {/* Division */}
            <div className="space-y-2">
              <Label htmlFor="division">
                {t("users.division")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              {isMounted && divisions.length > 0 ? (
                <Select
                  {...(formData.divisionId && { value: formData.divisionId })}
                  onValueChange={(value) => handleChange("divisionId", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("users.selectDivision")} />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.nameLocal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground">
                  Loading divisions...
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("users.password")}{" "}
                {!user && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={
                    user ? "Leave blank to keep current password" : "••••••••"
                  }
                  required={!user}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("users.confirmPassword")}{" "}
                {!user && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  placeholder={
                    user ? "Leave blank to keep current password" : "••••••••"
                  }
                  required={!user}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {t("users.activeUser")}
              </Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard/users`)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
