import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";

export const RegisterPage: React.FC = () => {
	const navigate = useNavigate();
	const { register, loading } = useAuth();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		confirmPassword: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (formData.password !== formData.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		try {
			const result = await register({
				email: formData.email,
				password: formData.password,
			});
			if (result.meta.requestStatus === "fulfilled") {
				toast.success(
					"Registration successful! Please log in."
				);
				navigate("/login");
			} else if (result.meta.requestStatus === "rejected") {
				toast.error(
					(result.payload as string) || "Registration failed"
				);
			}
		} catch (error) {
			toast.error("Registration failed");
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
						Join CogniFlow
					</h2>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Create your account to get started
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Sign Up</CardTitle>
						<CardDescription>
							Create a new account to start using CogniFlow
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									value={formData.email}
									onChange={handleInputChange}
									placeholder="Enter your email"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									required
									value={formData.password}
									onChange={handleInputChange}
									placeholder="Enter your password"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">
									Confirm Password
								</Label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									required
									value={formData.confirmPassword}
									onChange={handleInputChange}
									placeholder="Confirm your password"
								/>
							</div>

							{/* Error Display removed; use toastify for errors */}

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
							>
								{loading ? "Creating Account..." : "Create Account"}
							</Button>
						</form>

						<div className="mt-6 text-center">
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Already have an account?{" "}
								<Link
									to="/login"
									className="font-medium text-primary hover:text-primary/80"
								>
									Sign in
								</Link>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
