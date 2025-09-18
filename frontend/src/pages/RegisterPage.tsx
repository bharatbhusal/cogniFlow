import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
	useAppDispatch,
	useAppSelector,
	requestOTP,
} from "../redux";
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
	const dispatch = useAppDispatch();
	const { register, loading } = useAuth();
	const [step, setStep] = useState<1 | 2>(1);
	const [formData, setFormData] = useState({
		email: "",
		otp_code: "",
		password: "",
		confirmPassword: "",
	});

	const handleRequestOTP = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.email) {
			toast.error("Please enter your email");
			return;
		}

		try {
			const result = await dispatch(
				requestOTP({
					email: formData.email,
					purpose: "registration",
				})
			);

			if (result.meta.requestStatus === "fulfilled") {
				toast.success("OTP sent to your email successfully!");
				setStep(2);
			} else if (result.meta.requestStatus === "rejected") {
				toast.error(
					(result.payload as string) || "Failed to send OTP"
				);
			}
		} catch (error) {
			toast.error("Failed to send OTP");
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!formData.otp_code ||
			!formData.password ||
			!formData.confirmPassword
		) {
			toast.error("Please fill in all fields");
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		try {
			const result = await register({
				email: formData.email,
				otp_code: formData.otp_code,
				password: formData.password,
			});
			if (result.meta.requestStatus === "fulfilled") {
				toast.success(
					"Registration successful! Welcome to CogniFlow!"
				);
				navigate("/projects");
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

	const goBackToEmail = () => {
		setStep(1);
		setFormData((prev) => ({
			...prev,
			otp_code: "",
			password: "",
			confirmPassword: "",
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
							{step === 1
								? "Enter your email to get started"
								: "Enter OTP and create your password"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{step === 1 ? (
							<form
								onSubmit={handleRequestOTP}
								className="space-y-4"
							>
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

								<Button
									type="submit"
									className="w-full"
									disabled={loading}
								>
									{loading ? "Sending OTP..." : "Send OTP"}
								</Button>
							</form>
						) : (
							<form
								onSubmit={handleRegister}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										readOnly
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={goBackToEmail}
									>
										Change Email
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={goBackToEmail}
									>
										Resend OTP
									</Button>
								</div>

								<div className="space-y-2">
									<Label htmlFor="otp">Verification Code</Label>
									<Input
										id="otp_code"
										name="otp_code"
										type="text"
										required
										value={formData.otp_code}
										onChange={handleInputChange}
										placeholder="Enter 6-digit OTP"
										maxLength={6}
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

								<Button
									type="submit"
									className="w-full"
									disabled={loading}
								>
									{loading
										? "Creating Account..."
										: "Create Account"}
								</Button>
							</form>
						)}

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
