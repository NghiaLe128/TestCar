class GaugeController {
	constructor() {
		this.speedNeedle = document.getElementById('speedNeedle');
		this.powerNeedle = document.getElementById('powerNeedle');
		this.speedValue = document.getElementById('speedValue');
		this.powerValue = document.getElementById('powerValue');

		this.speedGauge = document.querySelector('.speed-gauge');
		this.powerGauge = document.querySelector('.power-gauge');

		this.maxSpeed = Number(this.speedGauge?.dataset.max ?? 160);
		this.maxPower = Number(this.powerGauge?.dataset.max ?? 400);
		this.maxRpmInput = 12000;
		this.storageKey = 'dashboard-gauge-state-v1';
		this.simulationTimer = null;
		this.state = {
			rpm: 0,
			power: 0
		};

		this.init();
	}

	init() {
		this.syncGaugeGeometry();
		this.restoreState();
		const initialRpm = this.state.rpm > 0 ? this.state.rpm : 6000;
		this.setValues({
			rpm: initialRpm,
			power: this.state.power ?? 0
		}, false);
		this.attachResizeSync();
		this.registerApi();
		this.startRandomSimulation();
	}

	syncGaugeGeometry() {
		this.createScale(this.speedGauge);
		this.createScale(this.powerGauge);
		this.updateGauge(this.speedNeedle, this.toGaugeRpm(this.state.rpm), this.maxSpeed);
		this.updateGauge(this.powerNeedle, this.state.power, this.maxPower);
	}

	attachResizeSync() {
		const sync = () => this.syncGaugeGeometry();
		window.addEventListener('resize', sync);
		window.addEventListener('load', sync);

		if (typeof window.ResizeObserver === 'function') {
			const observer = new window.ResizeObserver(sync);
			const speedFace = this.speedGauge?.querySelector('.gauge-face');
			const powerFace = this.powerGauge?.querySelector('.gauge-face');
			if (speedFace) {
				observer.observe(speedFace);
			}
			if (powerFace) {
				observer.observe(powerFace);
			}
			this.resizeObserver = observer;
		}
	}

	createScale(gaugeElement) {
		if (!gaugeElement) {
			return;
		}

		const maxValue = Number(gaugeElement.dataset.max ?? 100);
		const majorStep = Number(gaugeElement.dataset.step ?? 20);
		const minorStep = Number(gaugeElement.dataset.minor ?? majorStep / 2);
		const isRpmGauge = gaugeElement.classList.contains('speed-gauge');
		const ticksContainer = gaugeElement.querySelector('.gauge-ticks');
		const numbersContainer = gaugeElement.querySelector('.gauge-numbers');
		const face = gaugeElement.querySelector('.gauge-face');

		if (!ticksContainer || !numbersContainer || !face) {
			return;
		}

		ticksContainer.textContent = '';
		numbersContainer.textContent = '';

		const gaugeSize = face.clientWidth;
		const tickRadius = gaugeSize * 0.43;
		const numberInsetFromTicks = gaugeSize * 0.1;
		const mainNumberRadius = tickRadius - numberInsetFromTicks;
		const majorTickLength = gaugeSize * 0.0575;
		const needleLength = tickRadius + (majorTickLength / 2);
		const redlineStart = maxValue * 0.875;
		const minorCount = Math.round(maxValue / minorStep);
		const majorCount = Math.round(maxValue / majorStep);

		gaugeElement.style.setProperty('--needle-length', `${needleLength}px`);

		for (let index = 0; index <= minorCount; index += 1) {
			const value = index * minorStep;
			const angle = this.getAngle(value, maxValue, gaugeElement);
			const isMajor = Math.abs(value / majorStep - Math.round(value / majorStep)) < 0.0001;
			const tick = document.createElement('div');
			tick.className = `tick${isMajor ? ' major' : ''}`;
			if (isRpmGauge && value >= redlineStart) {
				tick.classList.add('danger');
			}
			tick.style.setProperty('--angle', `${angle}deg`);
			tick.style.setProperty('--tick-radius', `${tickRadius}px`);
			ticksContainer.appendChild(tick);
		}

		for (let index = 0; index <= majorCount; index += 1) {
			const value = index * majorStep;
			const angle = this.getAngle(value, maxValue, gaugeElement);
			const number = document.createElement('div');
			number.className = 'number';
			number.style.setProperty('--angle', `${angle}deg`);
			number.style.setProperty('--number-radius', `${mainNumberRadius}px`);
			number.textContent = isRpmGauge ? String(index) : String(Math.round(value));
			numbersContainer.appendChild(number);
		}
	}

	updateGauge(needle, value, maxValue) {
		const gaugeElement = needle === this.speedNeedle ? this.speedGauge : this.powerGauge;
		const rotation = this.getAngle(value, maxValue, gaugeElement);
		needle.style.setProperty('--needle-angle', `${rotation}deg`);

		if (needle === this.speedNeedle) {
			this.speedValue.textContent = String(Math.round(this.state.rpm));
		} else {
			this.powerValue.textContent = String(Math.round(this.state.power));
		}
	}

	getAngle(value, maxValue, gaugeElement) {
		const safeMax = maxValue > 0 ? maxValue : 1;
		const percentage = Math.min(Math.max(value / safeMax, 0), 1);
		const angleStart = Number(gaugeElement?.dataset.startAngle ?? -140);
		const angleEnd = Number(gaugeElement?.dataset.endAngle ?? 140);
		const needleOffset = Number(gaugeElement?.dataset.needleOffset ?? 0);
		return angleStart + percentage * (angleEnd - angleStart) + needleOffset;
	}

	parseInputValue(rawValue) {
		if (typeof rawValue === 'number') {
			return Number.isFinite(rawValue) ? rawValue : 0;
		}

		if (typeof rawValue === 'string') {
			const compact = rawValue.replace(/\u0000/g, '').trim();
			if (!compact) {
				return 0;
			}

			const fromNumber = Number(compact);
			if (Number.isFinite(fromNumber)) {
				return fromNumber;
			}

			// Accept payloads like "7,000", "7.000", "rpm=7000", etc.
			const digitsOnly = compact.replace(/[^\d-]/g, '');
			if (!digitsOnly || digitsOnly === '-') {
				return 0;
			}

			const fromDigits = Number(digitsOnly);
			if (Number.isFinite(fromDigits)) {
				return fromDigits;
			}
		}

		return 0;
	}

	clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	toGaugeRpm(rpmRaw) {
		const safeRpm = this.clamp(rpmRaw, 0, this.maxRpmInput);
		const gaugeScale = this.maxSpeed > 0 ? this.maxSpeed : 8;
		return (safeRpm / 1000) * (gaugeScale / 8);
	}

	setValues(payload = {}, save = true) {
		const parsedRpm = this.parseInputValue(payload.rpm);
		const parsedPower = this.parseInputValue(payload.power);
		const rpm = Math.round(this.clamp(parsedRpm, 0, this.maxRpmInput));
		const power = this.clamp(parsedPower, 0, this.maxPower);
		let gaugeRpmValue = this.toGaugeRpm(rpm);
		const rpmRemainder = rpm % 1000;
		const isNearMajorRpm = rpmRemainder <= 5 || rpmRemainder >= 995;
		if (isNearMajorRpm) {
			gaugeRpmValue = Math.round(rpm / 1000);
		}

		this.state.rpm = rpm;
		this.state.power = power;

		this.updateGauge(this.speedNeedle, gaugeRpmValue, this.maxSpeed);
		this.updateGauge(this.powerNeedle, power, this.maxPower);

		if (save) {
			this.saveState();
		}
	}

	startRandomSimulation(intervalMs = 900) {
		this.stopRandomSimulation();
		const minInterval = 150;
		const safeInterval = Math.max(Number(intervalMs) || 0, minInterval);

		this.simulationTimer = window.setInterval(() => {
			const rpm = Math.round(Math.random() * this.maxRpmInput);
			const powerRatio = this.maxRpmInput > 0 ? rpm / this.maxRpmInput : 0;
			const powerNoise = (Math.random() - 0.5) * 50;
			const power = this.clamp((powerRatio * this.maxPower) + powerNoise, 0, this.maxPower);

			this.setValues({ rpm, power }, true);
		}, safeInterval);
	}

	stopRandomSimulation() {
		if (this.simulationTimer !== null) {
			window.clearInterval(this.simulationTimer);
			this.simulationTimer = null;
		}
	}

	saveState() {
		try {
			window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
		} catch (error) {
			// Ignore storage write errors to keep gauge rendering stable.
		}
	}

	restoreState() {
		try {
			const storedState = window.localStorage.getItem(this.storageKey);
			if (!storedState) {
				return;
			}

			const parsed = JSON.parse(storedState);
			const rpm = this.clamp(this.parseInputValue(parsed?.rpm), 0, this.maxRpmInput);
			const power = this.clamp(this.parseInputValue(parsed?.power), 0, this.maxPower);
			this.state = { rpm, power };
		} catch (error) {
			this.state = { rpm: 0, power: 0 };
		}
	}

	registerApi() {
		window.dashboardGauge = {
			setValues: (payload) => this.setValues(payload, true),
			setRpm: (rpm) => this.setValues({ rpm, power: this.state.power }, true),
			setPower: (power) => this.setValues({ rpm: this.state.rpm, power }, true),
			getValues: () => ({ ...this.state }),
			startRandom: (intervalMs) => this.startRandomSimulation(intervalMs),
			stopRandom: () => this.stopRandomSimulation()
		};
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new GaugeController();
});