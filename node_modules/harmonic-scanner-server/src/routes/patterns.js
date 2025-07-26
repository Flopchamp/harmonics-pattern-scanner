const express = require('express');
const router = express.Router();
const { Pattern } = require('../models');
const PatternDetector = require('../utils/patternDetector');

const patternDetector = new PatternDetector();

/**
 * GET /api/patterns - Get detected patterns
 * Query params: symbol, timeframe, type, status, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const {
      symbol,
      timeframe,
      type,
      status,
      limit = 50,
      offset = 0
    } = req.query;

    const whereClause = {};
    
    if (symbol) whereClause.symbol = symbol;
    if (timeframe) whereClause.timeframe = timeframe;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const patterns = await Pattern.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['detectedAt', 'DESC']]
    });

    res.json({
      success: true,
      patterns: patterns.rows,
      total: patterns.count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(patterns.count / limit)
    });

  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns'
    });
  }
});

/**
 * GET /api/patterns/:id - Get specific pattern
 */
router.get('/:id', async (req, res) => {
  try {
    const pattern = await Pattern.findByPk(req.params.id);
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
    }

    res.json({
      success: true,
      pattern
    });

  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pattern'
    });
  }
});

/**
 * POST /api/patterns/detect - Manually trigger pattern detection
 */
router.post('/detect', async (req, res) => {
  try {
    const { symbol, timeframe, marketData } = req.body;

    if (!symbol || !timeframe || !marketData) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, timeframe, and marketData are required'
      });
    }

    // Detect patterns
    const detectedPatterns = await patternDetector.detectAllPatterns(marketData);
    
    // Save patterns to database
    const savedPatterns = [];
    
    for (const pattern of detectedPatterns) {
      if (pattern && pattern.type) {
        const savedPattern = await Pattern.create({
          symbol,
          timeframe,
          type: pattern.type,
          status: pattern.status,
          points: pattern.points,
          fibonacciRatios: pattern.fibonacciRatios,
          tradingLevels: pattern.tradingLevels,
          probability: pattern.probability
        });
        
        savedPatterns.push(savedPattern);
      }
    }

    res.json({
      success: true,
      patterns: savedPatterns,
      count: savedPatterns.length
    });

  } catch (error) {
    console.error('Error detecting patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect patterns'
    });
  }
});

/**
 * PUT /api/patterns/:id/status - Update pattern status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['forming', 'completed', 'invalidated'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: forming, completed, or invalidated'
      });
    }

    const pattern = await Pattern.findByPk(req.params.id);
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
    }

    // Update status and timestamp
    pattern.status = status;
    
    if (status === 'completed') {
      pattern.completedAt = new Date();
    } else if (status === 'invalidated') {
      pattern.invalidatedAt = new Date();
    }
    
    await pattern.save();

    res.json({
      success: true,
      pattern
    });

  } catch (error) {
    console.error('Error updating pattern status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pattern status'
    });
  }
});

/**
 * DELETE /api/patterns/:id - Delete pattern
 */
router.delete('/:id', async (req, res) => {
  try {
    const pattern = await Pattern.findByPk(req.params.id);
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        error: 'Pattern not found'
      });
    }

    await pattern.destroy();

    res.json({
      success: true,
      message: 'Pattern deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pattern'
    });
  }
});

/**
 * GET /api/patterns/stats/summary - Get pattern statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 1);
    }

    // Get pattern counts by type
    const patternCounts = await Pattern.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        detectedAt: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      group: ['type']
    });

    // Get pattern counts by status
    const statusCounts = await Pattern.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        detectedAt: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      group: ['status']
    });

    // Get most active symbols
    const symbolCounts = await Pattern.findAll({
      attributes: [
        'symbol',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        detectedAt: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      group: ['symbol'],
      order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
      limit: 10
    });

    // Get total patterns
    const totalPatterns = await Pattern.count({
      where: {
        detectedAt: {
          [require('sequelize').Op.gte]: startDate
        }
      }
    });

    // Calculate average probability
    const avgProbability = await Pattern.findOne({
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('probability')), 'avgProbability']
      ],
      where: {
        detectedAt: {
          [require('sequelize').Op.gte]: startDate
        },
        probability: {
          [require('sequelize').Op.not]: null
        }
      }
    });

    res.json({
      success: true,
      stats: {
        timeRange,
        totalPatterns,
        averageProbability: avgProbability?.dataValues?.avgProbability || 0,
        patternsByType: patternCounts.map(p => ({
          type: p.type,
          count: parseInt(p.dataValues.count)
        })),
        patternsByStatus: statusCounts.map(p => ({
          status: p.status,
          count: parseInt(p.dataValues.count)
        })),
        topSymbols: symbolCounts.map(p => ({
          symbol: p.symbol,
          count: parseInt(p.dataValues.count)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching pattern stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pattern statistics'
    });
  }
});

/**
 * GET /api/patterns/validate/:type - Validate pattern rules
 */
router.get('/validate/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { points } = req.query;

    if (!points) {
      return res.status(400).json({
        success: false,
        error: 'Pattern points are required'
      });
    }

    let parsedPoints;
    try {
      parsedPoints = JSON.parse(points);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid points format'
      });
    }

    // Validate pattern using pattern detector
    const isValid = validatePatternRules(type, parsedPoints);
    const ratios = calculateRatios(type, parsedPoints);

    res.json({
      success: true,
      validation: {
        isValid,
        type,
        ratios,
        probability: isValid ? calculateProbability(type, ratios) : 0
      }
    });

  } catch (error) {
    console.error('Error validating pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate pattern'
    });
  }
});

// Helper functions for pattern validation
function validatePatternRules(type, points) {
  // Implementation would depend on pattern type
  // This is a simplified version
  const detector = new PatternDetector();
  
  switch (type) {
    case 'Gartley':
      return validateGartley(points, detector);
    case 'Bat':
      return validateBat(points, detector);
    // Add other pattern validations
    default:
      return false;
  }
}

function validateGartley(points, detector) {
  if (!points.X || !points.A || !points.B || !points.C || !points.D) {
    return false;
  }
  
  const ratios = detector.calculateFibonacciRatios(
    points.X, points.A, points.B, points.C, points.D
  );
  
  return detector.isInRange(ratios.AB_XA, 0.618) &&
         detector.isInRange(ratios.BC_AB, 0.382, 0.786) &&
         (detector.isInRange(ratios.CD_AB, 1.272, 1.618) || 
          detector.isInRange(ratios.CD_XA, 0.786));
}

function validateBat(points, detector) {
  if (!points.X || !points.A || !points.B || !points.C || !points.D) {
    return false;
  }
  
  const ratios = detector.calculateFibonacciRatios(
    points.X, points.A, points.B, points.C, points.D
  );
  
  return detector.isInRange(ratios.AB_XA, 0.382, 0.50) &&
         detector.isInRange(ratios.BC_AB, 0.382, 0.886) &&
         (detector.isInRange(ratios.CD_XA, 0.886) || 
          detector.isInRange(ratios.CD_AB, 1.618, 2.618));
}

function calculateRatios(type, points) {
  const detector = new PatternDetector();
  
  if (type === 'Shark') {
    return detector.calculateSharkRatios(
      points.O, points.X, points.A, points.B, points.C
    );
  } else if (type === 'ABCD') {
    return detector.calculateABCDRatios(
      points.A, points.B, points.C, points.D
    );
  } else {
    return detector.calculateFibonacciRatios(
      points.X, points.A, points.B, points.C, points.D
    );
  }
}

function calculateProbability(type, ratios) {
  const detector = new PatternDetector();
  return detector.calculateProbability(type, ratios);
}

module.exports = router;
