import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RoiFieldValue } from '../roi-field-values/entities/roi-field-value.entity';
import { RoiVersionScenario } from '../roi-version-scenarios/entities/roi-version-scenario.entity';
import { RoiMetric } from '../roi-metrics/entities/roi-metric.entity';
import { RoiCashflow } from '../roi-cashflows/entities/roi-cashflow.entity';
import { RoiChartPoint } from '../roi-chart-points/entities/roi-chart-point.entity';
import { RoiProjectVersion } from '../roi-project-versions/entities/roi-project-version.entity';
import { successResponse } from '../../common/response';
import { RecalculateRoiDto } from './dto/recalculate-roi.dto';
import { AuditService } from 'src/common/audit.service';
import { RoiProject } from '../roi-projects/entities/roi-project.entity';

const F = {
  SKUS: 'skus',
  VIEWS_PER_SKU: 'views_per_sku',
  QC_HEADCOUNT: 'qc_headcount',
  SHIFTS_PER_DAY: 'shifts_per_day',
  UNITS_PER_INSPECTOR_DAY: 'units_per_inspector_per_day',
  OPERATING_DAYS: 'operating_days_per_year',
  CONTRACT_TERM: 'contract_term_years',
  MONTHLY_QC_COST: 'monthly_qc_cost',
  MODELING_FEE_PER_VIEW: 'modeling_fee_per_view',
  ANNUAL_LICENSE_PER_SKU: 'annual_license_per_sku',
  DISCOUNT_RATE: 'discount_rate',
  AI_UNITS: 'AIUnits',
} as const;

const M = {
  MANUAL_ANNUAL_COST: 'manual_annual_cost',
  ANNUAL_UNITS: 'annual_units',
  YEAR0_ENGINEERING: 'year0_engineering',
  ANNUAL_LICENSE: 'annual_license',
  MANUAL_CPU: 'manual_cpu',
  AI_CPU_Y1: 'ai_cpu_y1',
  AI_CPU_STEADY: 'ai_cpu_steady',
  ANNUAL_AI_UNITS: 'annual_ai_units',

  // Per-scenario
  ANNUAL_SAVINGS: 'annual_savings',
  YEAR1_NET: 'year1_net',
  PAYBACK_MONTHS: 'payback_months',
  TOTAL_NET_TERM: 'total_net_term',
  ROI_MULTIPLE: 'roi_multiple',
  NPV: 'npv',
  IRR: 'irr',
  EQUIV_INSPECTORS: 'equiv_inspectors',
  AI_COVERAGE_PERCENT: 'ai_coverage_percent',
} as const;

const C = {
  CUMULATIVE_NET: 'cumulative_net',
  ANNUAL_CASHFLOW: 'annual_cashflow',
  COST_PER_UNIT: 'cost_per_unit',
} as const;

const BASE_SCENARIO_ID = 0;
const DISCOUNT_RATE_FIELD_ID = 11;
interface Inputs {
  skus: number;
  viewsPerSku: number;
  qcHeadcount: number;
  shiftsPerDay: number;
  unitsPerInspector: number;
  operatingDays: number;
  termYears: number;
  monthlyQcCost: number;
  modelingFeePerView: number;
  annualLicensePerSku: number;
  discountRate: number;
  aiUnits: number;
}

interface BaseValues {
  manualAnnualCost: number;
  annualUnits: number;
  year0Engineering: number;
  annualLicense: number;
  manualCPU: number | null;
  aiCpuY1: number | null;
  aiCpuSteady: number | null;
  annualAiUnits: number;
}

interface CashflowRow {
  year: number;
  savings: number;
  costs: number;
  net: number;
}

interface ScenarioResult {
  annualSavings: number;
  year1Net: number;
  paybackMonths: number | null;
  totalNetTerm: number;
  roiMultiple: number | null;
  npv: number;
  irr: number | null;
  equivInspectors: number;
  cashflows: CashflowRow[];
  aiCoveragePercent: number | null;
}

@Injectable()
export class RoiCalculationService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(RoiFieldValue)
    private fieldValueRepo: Repository<RoiFieldValue>,
    @InjectRepository(RoiVersionScenario)
    private versionScenarioRepo: Repository<RoiVersionScenario>,
    @InjectRepository(RoiMetric)
    private metricRepo: Repository<RoiMetric>,
    @InjectRepository(RoiCashflow)
    private cashflowRepo: Repository<RoiCashflow>,
    @InjectRepository(RoiChartPoint)
    private chartPointRepo: Repository<RoiChartPoint>,
    @InjectRepository(RoiProjectVersion)
    private versionRepo: Repository<RoiProjectVersion>,
    @InjectRepository(RoiProject)
    private projectRepo: Repository<RoiProject>,
    private auditService: AuditService,
  ) { }

  async calculate(versionId: number, userId: number) {
    const version = await this.versionRepo.findOne({
      relations: ['project'],
      where: { id: versionId },
    });

    if (!version) {
      throw new Error(`Version with id ${versionId} not found`);
    }

    const projectId = Number(version.project.id);

    if (!projectId) {
      throw new Error(`Project with id ${version.project.id} not found`);
    }

    const statusVersion = version.status;

    const inputs = await this.loadInputs(versionId);

    const scenarios = await this.versionScenarioRepo.find({
      where: { version: { id: versionId } },
      relations: ['scenario'],
    });

    if (!scenarios.length) {
      throw new Error(
        `No scenarios for version ${versionId}. Run seed roi_version_scenarios first.`,
      );
    }

    const base = this.calcBaseValues(inputs);

    return this.dataSource.transaction(async () => {
      await this.metricRepo.delete({ version: { id: versionId } });
      await this.cashflowRepo.delete({ version: { id: versionId } });
      await this.chartPointRepo.delete({ version: { id: versionId } });
      await this.saveBaseMetrics(versionId, base);

      const scenarioResults: Record<number, ScenarioResult> = {};

      for (const scenario of scenarios) {
        scenarioResults[scenario.scenario.id] = await this.calcAndSaveScenario(
          versionId,
          scenario,
          base,
          inputs,
        );
      }

      await this.saveChartPoints(versionId, scenarios, base, scenarioResults);

      // Cập nhật status thành 'success' khi calculate thành công
      await this.versionRepo.update(versionId, {
        status: 'success',
        isLockedSnapshot: true,
      });

      // Ghi audit log cho việc cập nhật status
      await this.auditService.logAudit({
        action: 'UPDATE',
        entityType: 'roi_project_version',
        entityId: versionId,
        userId: userId,
        changes: [
          {
            fieldCode: 'status',
            oldValue: statusVersion,
            newValue: 'success',
          },
          {
            fieldCode: 'is_locked_snapshot',
            oldValue: version.isLockedSnapshot,
            newValue: true,
          },
        ],
      });

      return successResponse({
        message: 'ROI calculated successfully',
        data: { versionId, projectId: projectId, base, scenarios: scenarioResults, statusVersion: 'success' },
      });
    });
  }


  async recalculate(versionId: number, dto: RecalculateRoiDto, userId: number) {
    const version = await this.versionRepo.findOne({ where: { id: versionId } });
    if (!version) throw new Error(`Version ${versionId} not found`);

    // Bỏ check status 'success' để cho phép tính toán lại nếu cần

    for (const field of dto.fields) {
      if (field.fieldId === DISCOUNT_RATE_FIELD_ID) {
        if (field.value < 0 || field.value > 100) {
          throw new BadRequestException('discount_rate must be between 0 and 100');
        }
      } else {
        if (field.value <= 0) {
          throw new BadRequestException(
            `Field ${field.fieldId} must be greater than 0`,
          );
        }
      }
    }

    for (const field of dto.fields) {
      await this.dataSource.query(
        `UPDATE roi_field_values
       SET value_numeric = $1
       WHERE version_id = $2 AND field_id = $3`,
        [field.value, versionId, field.fieldId],
      );
    }

    return this.calculate(versionId, userId);
  }

  async findByVersion(versionId: number) {
    const [metrics, cashflows, chartPoints] = await Promise.all([
      this.metricRepo.find({ where: { version: { id: versionId } } }),
      this.cashflowRepo.find({ where: { version: { id: versionId } } }),
      this.chartPointRepo.find({ where: { version: { id: versionId } } }),
    ]);

    return successResponse({
      message: 'Get ROI metrics successfully',
      data: { metrics, cashflows, chartPoints },
    });
  }

  private async loadInputs(versionId: number): Promise<Inputs> {
    const rows: { code: string; value_numeric: string }[] =
      await this.dataSource.query(
        `SELECT fd.code, fv.value_numeric
                 FROM roi_field_values fv
                 INNER JOIN roi_field_definitions fd ON fd.id = fv.field_id
                 WHERE fv.version_id = $1`,
        [versionId],
      );

    const map: Record<string, number> = {};
    for (const row of rows) {
      if (row.value_numeric != null) {
        map[row.code] = parseFloat(row.value_numeric);
      }
    }

    const get = (code: string, fallback = 0): number => map[code] ?? fallback;

    return {
      skus: get(F.SKUS),
      viewsPerSku: get(F.VIEWS_PER_SKU, 1),
      qcHeadcount: get(F.QC_HEADCOUNT),
      shiftsPerDay: get(F.SHIFTS_PER_DAY, 1),
      unitsPerInspector: get(F.UNITS_PER_INSPECTOR_DAY),
      operatingDays: get(F.OPERATING_DAYS),
      termYears: get(F.CONTRACT_TERM, 3),
      monthlyQcCost: get(F.MONTHLY_QC_COST),
      modelingFeePerView: get(F.MODELING_FEE_PER_VIEW),
      annualLicensePerSku: get(F.ANNUAL_LICENSE_PER_SKU),
      discountRate: get(F.DISCOUNT_RATE, 0.1),
      aiUnits: get(F.AI_UNITS, 10),
    };
  }

  private calcBaseValues(i: Inputs): BaseValues {
    const manualAnnualCost =
      i.qcHeadcount * i.shiftsPerDay * i.monthlyQcCost * 12;

    const annualUnits = i.unitsPerInspector * i.qcHeadcount * i.operatingDays;

    const year0Engineering = i.skus * i.viewsPerSku * i.modelingFeePerView;

    const annualLicense = i.skus * i.annualLicensePerSku;
    const manualCPU = annualUnits > 0 ? manualAnnualCost / annualUnits : null;

    // Calculate total units processed by AI in a year
    const annualAiUnits = i.aiUnits * i.operatingDays;

    // Updated formulas based on Annual AI Units
    const aiCpuY1 = annualAiUnits > 0 ? (year0Engineering + annualLicense) / annualAiUnits : null;
    const aiCpuSteady = annualAiUnits > 0 ? annualLicense / annualAiUnits : null;

    return {
      manualAnnualCost,
      annualUnits,
      year0Engineering,
      annualLicense,
      manualCPU,
      aiCpuY1,
      aiCpuSteady,
      annualAiUnits,
    };
  }

  private async saveBaseMetrics(versionId: number, base: BaseValues) {
    const rows = [
      { code: M.MANUAL_ANNUAL_COST, value: base.manualAnnualCost },
      { code: M.ANNUAL_UNITS, value: base.annualUnits },
      { code: M.YEAR0_ENGINEERING, value: base.year0Engineering },
      { code: M.ANNUAL_LICENSE, value: base.annualLicense },
      { code: M.MANUAL_CPU, value: base.manualCPU },
      { code: M.AI_CPU_Y1, value: base.aiCpuY1 },
      { code: M.AI_CPU_STEADY, value: base.aiCpuSteady },
      { code: M.ANNUAL_AI_UNITS, value: base.annualAiUnits },
    ];

    await this.metricRepo.save(
      rows.map((r) => {
        let textValue: string | undefined = undefined;
        if (r.value === null) {
          // Chỉ dùng dấu '—' cho các trường cost/unit, còn lại dùng 'N/A'
          const isCpuMetric = [M.MANUAL_CPU, M.AI_CPU_Y1, M.AI_CPU_STEADY].includes(r.code as any);
          textValue = isCpuMetric ? '—' : 'N/A';
        }

        return {
          version: { id: versionId },
          scenarioId: { id: BASE_SCENARIO_ID },
          metricCode: r.code,
          valueNumeric: r.value ?? undefined,
          valueText: textValue,
        };
      }),
    );
  }

  private async calcAndSaveScenario(
    versionId: number,
    scenario: RoiVersionScenario,
    base: BaseValues,
    inputs: Inputs,
  ): Promise<ScenarioResult> {
    const reduction = Number(scenario.workforceReduction) / 100;
    const throughput = Number(scenario.throughputMultiplier);
    const { manualAnnualCost, year0Engineering, annualLicense } = base;
    const { termYears, discountRate, qcHeadcount, operatingDays } = inputs;

    const annualSavings = manualAnnualCost * reduction;

    const year1Net = annualSavings - annualLicense;

    const netAnnualBenefit = annualSavings - annualLicense;
    const paybackMonths = netAnnualBenefit > 0
      ? (year0Engineering / netAnnualBenefit) * 12
      : null;

    const totalNetTerm =
      annualSavings * termYears -
      (year0Engineering + annualLicense * termYears);

    const totalInvestTerm = year0Engineering + annualLicense * termYears;
    const roiMultiple =
      totalInvestTerm > 0
        ? (annualSavings * termYears) / totalInvestTerm
        : null;

    const equivInspectors = qcHeadcount * throughput;

    const aiCoveragePercent = (base.annualUnits * throughput) > 0
      ? inputs.aiUnits * inputs.operatingDays / (base.annualUnits * throughput)
      : null;
    const cashflows: CashflowRow[] = [];
    for (let y = 0; y <= termYears; y++) {
      let savings = 0,
        costs = 0;
      if (y === 0) {
        costs = year0Engineering;
      } else if (y <= termYears) {
        savings = annualSavings;
        costs = annualLicense;
      }

      cashflows.push({ year: y, savings, costs, net: savings - costs });
    }

    const npv = cashflows
      .slice(0, termYears + 1)
      .reduce((sum, cf, y) => sum + cf.net / Math.pow(1 + discountRate, y), 0);

    const irr = this.calcIrr(
      cashflows.slice(0, termYears + 1).map((cf) => cf.net),
    );

    await this.cashflowRepo.save(
      cashflows.map((cf) =>
        this.cashflowRepo.create({
          version: { id: versionId },
          scenario: { id: scenario.scenario.id },
          yearIndex: cf.year,
          savings: cf.savings,
          costs: cf.costs,
          net: cf.net,
        }),
      ),
    );

    await this.metricRepo.save(
      [
        { code: M.ANNUAL_SAVINGS, value: annualSavings, text: null },
        { code: M.YEAR1_NET, value: year1Net, text: null },
        {
          code: M.PAYBACK_MONTHS,
          value: paybackMonths,
          text: paybackMonths === null ? 'N/A' : null,
        },
        { code: M.TOTAL_NET_TERM, value: totalNetTerm, text: null },
        {
          code: M.ROI_MULTIPLE,
          value: roiMultiple,
          text: roiMultiple === null ? 'N/A' : null,
        },
        { code: M.NPV, value: npv, text: null },
        { code: M.IRR, value: irr, text: irr === null ? 'N/A' : null },
        { code: M.EQUIV_INSPECTORS, value: equivInspectors, text: null },
        { code: M.AI_COVERAGE_PERCENT, value: aiCoveragePercent, text: aiCoveragePercent === null ? 'N/A' : null },
      ].map((m) => ({
        version: { id: versionId },
        scenario: { id: scenario.scenario.id },
        metricCode: m.code,
        valueNumeric: m.value ?? undefined,
        valueText: m.text ?? undefined,
      })),
    );

    return {
      annualSavings,
      year1Net,
      paybackMonths,
      totalNetTerm,
      roiMultiple,
      npv,
      irr,
      equivInspectors,
      cashflows,
      aiCoveragePercent
      
    };
  }

  private calcIrr(
    cashflows: number[],
    maxIter = 200,
    tol = 1e-7,
  ): number | null {
    const hasNeg = cashflows.some((cf) => cf < 0);
    const hasPos = cashflows.some((cf) => cf > 0);
    if (!hasNeg || !hasPos) return null;

    let r = 0.1;

    for (let i = 0; i < maxIter; i++) {
      const f = cashflows.reduce(
        (sum, cf, y) => sum + cf / Math.pow(1 + r, y),
        0,
      );
      const df = cashflows.reduce(
        (sum, cf, y) => sum - (y * cf) / Math.pow(1 + r, y + 1),
        0,
      );

      if (Math.abs(df) < tol) return null;
      const rNew = r - f / df;
      if (Math.abs(rNew - r) < tol) return parseFloat(rNew.toFixed(6));
      r = rNew;
    }

    return null;
  }

  private async saveChartPoints(
    versionId: number,
    scenarios: RoiVersionScenario[],
    base: BaseValues,
    scenarioResults: Record<number, ScenarioResult>,
  ) {
    const points: any[] = [];

    for (const scenario of scenarios) {
      const result = scenarioResults[scenario.scenario.id];
      if (!result) continue;

      let cumNet = 0;
      for (const cf of result.cashflows) {
        const prev = cumNet;
        cumNet += cf.net;
        points.push(
          this.chartPointRepo.create({
            version: { id: versionId },
            scenario: { id: scenario.scenario.id },
            chartCode: C.CUMULATIVE_NET,
            xKey: `Year ${cf.year}`,
            yValue: cumNet,
            meta: {
              net: cf.net,
              isBreakEven: prev < 0 && cumNet >= 0,
            },
          }),
        );
      }
      for (const cf of result.cashflows) {
        points.push(
          this.chartPointRepo.create({
            version: { id: versionId },
            scenario: { id: scenario.scenario.id },
            chartCode: C.ANNUAL_CASHFLOW,
            xKey: `Year ${cf.year}`,
            yValue: cf.net,
            meta: {
              savings: cf.savings,
              costs: cf.costs,
              label:
                cf.year === 0 ? 'Engineering (one-time)' : 'Savings − License',
            },
          }),
        );
      }
    }

    if (base.annualUnits > 0) {
      for (const row of [
        { xKey: 'Manual', yValue: base.manualCPU, meta: {} },
        {
          xKey: 'AI (Year 1)',
          yValue: base.aiCpuY1,
          meta: { note: 'Year 1 includes one-time engineering' },
        },
        { xKey: 'AI (Steady)', yValue: base.aiCpuSteady, meta: {} },
      ]) {
        if (row.yValue !== null) {
          points.push(
            this.chartPointRepo.create({
              version: { id: versionId },
              scenario: { id: scenarios[0].scenario.id },
              chartCode: C.COST_PER_UNIT,
              xKey: row.xKey,
              yValue: row.yValue,
              meta: row.meta,
            }),
          );
        }
      }
    }

    await this.chartPointRepo.save(points);
  }
}
