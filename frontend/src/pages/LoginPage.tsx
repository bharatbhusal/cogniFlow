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

export const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { login, loading } = useAuth();
	const [step, setStep] = useState<1 | 2>(1);
	const [credentials, setCredentials] = useState({
		email: "",
		otp_code: "",
		password: "",
	});

	const handleRequestOTP = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!credentials.email) {
			toast.error("Please enter your email");
			return;
		}

		try {
			const result = await dispatch(
				requestOTP({
					email: credentials.email,
					purpose: "login",
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

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!credentials.otp_code || !credentials.password) {
			toast.error("Please fill in all fields");
			return;
		}

		try {
			const result = await login({
				email: credentials.email,
				otp_code: credentials.otp_code,
				password: credentials.password,
			});
			if (result.meta.requestStatus === "fulfilled") {
				toast.success("Login successful!");
				navigate("/projects");
			} else if (result.meta.requestStatus === "rejected") {
				toast.error(
					(result.payload as string) || "Login failed"
				);
			}
		} catch (error) {
			toast.error("Login failed");
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const { name, value } = e.target;
		setCredentials((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const goBackToEmail = () => {
		setStep(1);
		setCredentials((prev) => ({
			...prev,
			otp: "",
			password: "",
		}));
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
						Welcome to CogniFlow
					</h2>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Sign in to your account
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Sign In</CardTitle>
						<CardDescription>
							{step === 1
								? "Enter your email to get started"
								: "Enter OTP and password to sign in"}
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
										value={credentials.email}
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
							<form onSubmit={handleLogin} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={credentials.email}
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
									<Label htmlFor="otp_code">Verification Code</Label>
									<Input
										id="otp_code"
										name="otp_code"
										type="text"
										required
										value={credentials.otp_code}
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
										autoComplete="current-password"
										required
										value={credentials.password}
										onChange={handleInputChange}
										placeholder="Enter your password"
									/>
								</div>

								<Button
									type="submit"
									className="w-full"
									disabled={loading}
								>
									{loading ? "Signing in..." : "Sign In"}
								</Button>
							</form>
						)}

						<div className="mt-6 text-center">
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Don't have an account?{" "}
								<Link
									to="/register"
									className="font-medium text-primary hover:text-primary/80"
								>
									Sign up
								</Link>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
